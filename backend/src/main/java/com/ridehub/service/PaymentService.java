package com.ridehub.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import com.ridehub.dto.PaymentOrderResponse;
import com.ridehub.dto.PaymentVerificationRequest;
import com.ridehub.model.*;
import com.ridehub.repository.*;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {
    
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RideRepository rideRepository;
    private final WalletService walletService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    
    @Value("${razorpay.key.id}")
    private String razorpayKeyId;
    
    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;
    
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    @Transactional
    public PaymentOrderResponse createPaymentOrder(Long bookingId) throws RazorpayException {
        User passenger = getCurrentUser();
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (!booking.getPassenger().getId().equals(passenger.getId())) {
            throw new RuntimeException("Unauthorized access to booking");
        }
        
        if (booking.getStatus() != Booking.BookingStatus.PAYMENT_PENDING) {
            throw new RuntimeException("Booking is not in payment pending status");
        }
        
        if (booking.getFinalPrice() == null) {
            throw new RuntimeException("Final price not calculated yet");
        }
        
        // Check if payment already exists - return existing order instead of error
        var existingPayment = paymentRepository.findByBooking(booking);
        if (existingPayment.isPresent()) {
            Payment payment = existingPayment.get();
            
            // Only return existing if it's still pending
            if (payment.getStatus() == Payment.PaymentStatus.PENDING) {
                System.out.println("Returning existing payment order: " + payment.getRazorpayOrderId());
                
                return PaymentOrderResponse.builder()
                        .razorpayOrderId(payment.getRazorpayOrderId())
                        .amount(payment.getAmount())
                        .currency("INR")
                        .bookingId(booking.getId())
                        .razorpayKey(razorpayKeyId)
                        .build();
            } else {
                throw new RuntimeException("Payment already " + payment.getStatus().toString().toLowerCase() + " for this booking");
            }
        }
        
        // Create Razorpay order
        RazorpayClient razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", (int)(booking.getFinalPrice() * 100)); // Amount in paise
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "booking_" + booking.getId());
        
        JSONObject notes = new JSONObject();
        notes.put("booking_id", booking.getId());
        notes.put("passenger_id", passenger.getId());
        notes.put("driver_id", booking.getRide().getDriver().getId());
        orderRequest.put("notes", notes);
        
        Order razorpayOrder = razorpayClient.orders.create(orderRequest);
        
        // Calculate final seat rate
        Ride ride = booking.getRide();
        List<Booking> activeBookings = bookingRepository.findActiveBookingsByRide(ride);
        int totalBookedSeats = activeBookings.stream()
                .mapToInt(Booking::getSeatsBooked)
                .sum();
        
        double finalSeatRate = booking.getTotalTripCost() / totalBookedSeats;
        
        // Create payment record
        Payment payment = Payment.builder()
                .booking(booking)
                .passenger(passenger)
                .driver(booking.getRide().getDriver())
                .razorpayOrderId(razorpayOrder.get("id"))
                .amount(booking.getFinalPrice())
                .finalSeatRate(finalSeatRate)
                .totalBookedSeats(totalBookedSeats)
                .status(Payment.PaymentStatus.PENDING)
                .build();
        
        paymentRepository.save(payment);
        
        return PaymentOrderResponse.builder()
                .razorpayOrderId(razorpayOrder.get("id"))
                .amount(booking.getFinalPrice())
                .currency("INR")
                .bookingId(booking.getId())
                .razorpayKey(razorpayKeyId)
                .build();
    }
    
    @Transactional
    public void verifyAndCompletePayment(PaymentVerificationRequest request) throws RazorpayException {
        User passenger = getCurrentUser();
        
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (!booking.getPassenger().getId().equals(passenger.getId())) {
            throw new RuntimeException("Unauthorized access to booking");
        }
        
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        
        // Verify signature (skip for mock payments in development)
        boolean isValidSignature = false;
        
        // Check if this is a mock payment (for development)
        boolean isMockPayment = request.getRazorpayPaymentId().startsWith("pay_mock_");
        
        if (isMockPayment) {
            System.out.println("⚠️ DEV MODE: Accepting mock payment for testing");
            isValidSignature = true;
        } else {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", request.getRazorpayOrderId());
            options.put("razorpay_payment_id", request.getRazorpayPaymentId());
            options.put("razorpay_signature", request.getRazorpaySignature());
            
            isValidSignature = Utils.verifyPaymentSignature(options, razorpayKeySecret);
        }
        
        if (!isValidSignature) {
            payment.setStatus(Payment.PaymentStatus.FAILED);
            payment.setFailureReason("Invalid signature");
            paymentRepository.save(payment);
            throw new RuntimeException("Payment verification failed");
        }
        
        // Update payment
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setStatus(Payment.PaymentStatus.COMPLETED);
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);
        
        // Update booking
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setPaidAt(LocalDateTime.now());
        bookingRepository.save(booking);
        
        System.out.println("=== PAYMENT VERIFICATION SUCCESS ===");
        System.out.println("Booking ID: " + booking.getId());
        System.out.println("Payment Amount: ₹" + payment.getAmount());
        System.out.println("Driver ID: " + booking.getRide().getDriver().getId());
        System.out.println("Driver Email: " + booking.getRide().getDriver().getEmail());
        
        // Credit amount to driver's wallet (locked)
        walletService.creditToWallet(
                booking.getRide().getDriver(), 
                payment.getAmount(), 
                payment, 
                booking
        );
        
        System.out.println("✓ Wallet credited successfully");
        System.out.println("====================================");
        
        // Send notifications
        notificationService.sendPaymentSuccessNotification(passenger, booking, payment);
        notificationService.sendDriverPaymentNotification(
                booking.getRide().getDriver(), 
                booking, 
                payment
        );
        
        // Send confirmation emails
        emailService.sendPaymentConfirmationEmail(passenger, booking, payment);
        emailService.sendDriverPaymentReceivedEmail(booking.getRide().getDriver(), booking, payment);
    }
    
    public List<Payment> getPassengerPayments() {
        User passenger = getCurrentUser();
        return paymentRepository.findByPassengerId(passenger.getId());
    }
    
    public List<Payment> getDriverPayments() {
        User driver = getCurrentUser();
        return paymentRepository.findByDriverId(driver.getId());
    }
}
