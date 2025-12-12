package com.ridehub.service;

import com.razorpay.Payment;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Refund;
import com.ridehub.model.Booking;
import com.ridehub.model.User;
import com.ridehub.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefundService {
    
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    
    @Value("${razorpay.key.id}")
    private String razorpayKeyId;
    
    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;
    
    /**
     * Process 100% refund for driver cancellation (after 48-hour window but before start time)
     */
    @Transactional
    public void processDriverCancellationRefund(Booking booking, String reason) {
        log.info("Processing 100% refund for booking {} due to driver cancellation", booking.getId());
        
        try {
            // Find payment for this booking
            com.ridehub.model.Payment payment = paymentRepository.findByBooking(booking)
                    .orElseThrow(() -> new RuntimeException("Payment not found for booking"));
            
            if (payment.getStatus() != com.ridehub.model.Payment.PaymentStatus.COMPLETED) {
                log.warn("Payment not in COMPLETED status, cannot refund. Status: {}", payment.getStatus());
                return;
            }
            
            // Initiate Razorpay refund
            RazorpayClient razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            
            // Get the payment from Razorpay
            Payment razorpayPayment = razorpayClient.payments.fetch(payment.getRazorpayPaymentId());
            
            // Create refund request (100% refund)
            JSONObject refundRequest = new JSONObject();
            refundRequest.put("amount", (int)(payment.getAmount() * 100)); // Full amount in paise
            refundRequest.put("speed", "normal"); // normal speed for standard refunds
            
            JSONObject notes = new JSONObject();
            notes.put("booking_id", booking.getId());
            notes.put("reason", reason);
            notes.put("refund_type", "DRIVER_CANCELLATION");
            refundRequest.put("notes", notes);
            
            // Create refund using Razorpay client
            Refund razorpayRefund = razorpayClient.payments.refund(payment.getRazorpayPaymentId(), refundRequest);
            
            // Update payment status
            payment.setStatus(com.ridehub.model.Payment.PaymentStatus.REFUNDED);
            paymentRepository.save(payment);
            
            // Send instant WebSocket notification
            notificationService.sendRefundNotification(
                booking.getPassenger(), 
                booking, 
                payment.getAmount(), 
                "Driver cancelled the ride"
            );
            
            // Send email notification
            emailService.sendDriverCancellationEmailToPassengers(
                List.of(booking.getPassenger()), 
                booking.getRide(), 
                reason
            );
            
            log.info("Refund initiated successfully. Refund ID: {}", razorpayRefund.get("id").toString());
            
        } catch (RazorpayException e) {
            log.error("Failed to process refund for booking {}: {}", booking.getId(), e.getMessage());
            
            // Notify passenger about refund failure
            notificationService.sendRefundFailureNotification(booking.getPassenger(), booking);
            
            throw new RuntimeException("Failed to process refund: " + e.getMessage());
        }
    }
    
    /**
     * Process refunds for all passengers when driver cancels the entire ride
     */
    @Transactional
    public void processDriverCancellationRefundForAllPassengers(List<Booking> bookings, String reason) {
        log.info("Processing refunds for {} bookings due to driver cancellation", bookings.size());
        
        for (Booking booking : bookings) {
            try {
                processDriverCancellationRefund(booking, reason);
            } catch (Exception e) {
                log.error("Failed to process refund for booking {}: {}", booking.getId(), e.getMessage());
                // Continue processing other refunds even if one fails
            }
        }
    }
    
    /**
     * Process refund for a single booking
     */
    @Transactional
    public void processRefund(Booking booking) {
        processDriverCancellationRefund(booking, "Ride cancelled by driver");
    }
}
