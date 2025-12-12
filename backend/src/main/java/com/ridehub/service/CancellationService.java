package com.ridehub.service;

import com.razorpay.Payment;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Refund;
import com.ridehub.model.*;
import com.ridehub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
@Slf4j
public class CancellationService {
    
    private final BookingRepository bookingRepository;
    private final RideRepository rideRepository;
    private final PaymentRepository paymentRepository;
    private final DriverWarningRepository driverWarningRepository;
    private final UserRepository userRepository;
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
    
    /**
     * Calculate refund percentage based on cancellation time
     */
    public RefundCalculation calculateRefund(Booking booking, LocalDateTime cancellationTime) {
        Ride ride = booking.getRide();
        LocalDateTime tripStartTime = LocalDateTime.of(ride.getRideDate(), ride.getRideTime());
        
        long hoursUntilTrip = Duration.between(cancellationTime, tripStartTime).toHours();
        long minutesUntilTrip = Duration.between(cancellationTime, tripStartTime).toMinutes();
        
        double refundPercentage;
        double penaltyPercentage;
        String reason;
        
        if (hoursUntilTrip >= 48) {
            // More than 48 hours: Full refund
            refundPercentage = 1.0;
            penaltyPercentage = 0.0;
            reason = "Cancellation more than 48 hours before trip";
        } else if (hoursUntilTrip >= 24) {
            // 24-48 hours: 90% refund
            refundPercentage = 0.90;
            penaltyPercentage = 0.10;
            reason = "Cancellation between 24-48 hours before trip (10% penalty)";
        } else if (hoursUntilTrip >= 12) {
            // 12-24 hours: 75% refund
            refundPercentage = 0.75;
            penaltyPercentage = 0.25;
            reason = "Cancellation between 12-24 hours before trip (25% penalty)";
        } else if (minutesUntilTrip >= 60) {
            // 1-12 hours: 50% refund
            refundPercentage = 0.50;
            penaltyPercentage = 0.50;
            reason = "Cancellation within 1-12 hours of trip (50% penalty)";
        } else if (minutesUntilTrip >= 0) {
            // Less than 1 hour but before start: 25% refund
            refundPercentage = 0.25;
            penaltyPercentage = 0.75;
            reason = "Cancellation within 1 hour of trip (75% penalty)";
        } else {
            // After trip start time: No refund
            long hoursAfterStart = Math.abs(hoursUntilTrip);
            if (hoursAfterStart <= 1) {
                refundPercentage = 0.0;
                penaltyPercentage = 1.0;
                reason = "Cancellation after trip start time (no refund)";
            } else {
                // More than 1 hour after start: booking should have been auto-cancelled
                refundPercentage = 0.0;
                penaltyPercentage = 1.0;
                reason = "No-show: Trip already started (no refund)";
            }
        }
        
        double refundAmount = booking.getFinalPrice() * refundPercentage;
        double penaltyAmount = booking.getFinalPrice() * penaltyPercentage;
        
        return RefundCalculation.builder()
                .refundPercentage(refundPercentage)
                .penaltyPercentage(penaltyPercentage)
                .refundAmount(refundAmount)
                .penaltyAmount(penaltyAmount)
                .hoursUntilTrip(hoursUntilTrip)
                .reason(reason)
                .build();
    }
    
    /**
     * Passenger cancels booking
     */
    @Transactional
    public void cancelBookingByPassenger(Long bookingId, String reason) {
        User passenger = getCurrentUser();
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (!booking.getPassenger().getId().equals(passenger.getId())) {
            throw new RuntimeException("Unauthorized: Not your booking");
        }
        
        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking already cancelled");
        }
        
        if (booking.getStatus() == Booking.BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel completed booking");
        }
        
        Ride ride = booking.getRide();
        
        if (ride.getTripStatus() == Ride.TripStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel - trip already completed");
        }
        
        LocalDateTime cancellationTime = LocalDateTime.now();
        
        // Calculate refund
        RefundCalculation refundCalc = calculateRefund(booking, cancellationTime);
        
        log.info("Passenger {} cancelling booking {}. Refund: {}%, Penalty: {}%", 
                passenger.getId(), bookingId, 
                refundCalc.getRefundPercentage() * 100, 
                refundCalc.getPenaltyPercentage() * 100);
        
        // Process refund via Razorpay
        processRefund(booking, refundCalc, reason);
        
        // Update booking status
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        
        // Update ride available seats
        ride.setAvailableSeats(ride.getAvailableSeats() + booking.getSeatsBooked());
        if (ride.getStatus() == Ride.RideStatus.FULL) {
            ride.setStatus(Ride.RideStatus.AVAILABLE);
        }
        rideRepository.save(ride);
        
        // Send notifications
        notificationService.sendCancellationConfirmation(passenger, booking, refundCalc);
        emailService.sendPassengerCancellationEmail(passenger, booking, refundCalc, reason);
        
        // Notify driver
        notificationService.sendPassengerCancelledNotification(ride.getDriver(), booking, passenger);
        emailService.sendDriverPassengerCancelledEmail(ride.getDriver(), booking, passenger);
    }
    
    /**
     * Driver cancels entire ride
     */
    @Transactional
    public void cancelRideByDriver(Long rideId, String reason) {
        User driver = getCurrentUser();
        
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        
        if (!ride.getDriver().getId().equals(driver.getId())) {
            throw new RuntimeException("Unauthorized: Not your ride");
        }
        
        if (ride.getStatus() == Ride.RideStatus.CANCELLED) {
            throw new RuntimeException("Ride already cancelled");
        }
        
        if (ride.getTripStatus() == Ride.TripStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel completed trip");
        }
        
        LocalDateTime cancellationTime = LocalDateTime.now();
        LocalDateTime tripStartTime = LocalDateTime.of(ride.getRideDate(), ride.getRideTime());
        long hoursUntilTrip = Duration.between(cancellationTime, tripStartTime).toHours();
        
        // Get all confirmed bookings
        java.util.List<Booking> confirmedBookings = bookingRepository.findActiveBookingsByRide(ride);
        
        log.info("Driver {} cancelling ride {}. Hours until trip: {}. Affected bookings: {}", 
                driver.getId(), rideId, hoursUntilTrip, confirmedBookings.size());
        
        // Issue warning to driver if cancellation is within 48 hours
        if (hoursUntilTrip < 48) {
            DriverWarning.WarningType warningType = hoursUntilTrip < 1 
                    ? DriverWarning.WarningType.LAST_MINUTE_CANCELLATION 
                    : DriverWarning.WarningType.LATE_CANCELLATION;
            
            DriverWarning warning = DriverWarning.builder()
                    .driver(driver)
                    .ride(ride)
                    .warningType(warningType)
                    .reason(String.format("Cancelled ride with %d hours notice. Reason: %s", hoursUntilTrip, reason))
                    .issuedAt(cancellationTime)
                    .resolved(false)
                    .build();
            
            driverWarningRepository.save(warning);
            
            log.warn("Warning issued to driver {} for late cancellation", driver.getId());
        }
        
        // Process 100% refund for all passengers
        for (Booking booking : confirmedBookings) {
            try {
                RefundCalculation fullRefund = RefundCalculation.builder()
                        .refundPercentage(1.0)
                        .penaltyPercentage(0.0)
                        .refundAmount(booking.getFinalPrice())
                        .penaltyAmount(0.0)
                        .hoursUntilTrip(hoursUntilTrip)
                        .reason("Driver cancelled ride - Full refund")
                        .build();
                
                processRefund(booking, fullRefund, reason);
                
                booking.setStatus(Booking.BookingStatus.CANCELLED);
                bookingRepository.save(booking);
                
                // Notify passenger
                notificationService.sendDriverCancelledNotification(booking.getPassenger(), booking, ride);
                emailService.sendDriverCancellationEmailToPassenger(booking.getPassenger(), ride, reason);
                
            } catch (Exception e) {
                log.error("Failed to process refund for booking {}: {}", booking.getId(), e.getMessage());
            }
        }
        
        // Update ride status
        ride.setStatus(Ride.RideStatus.CANCELLED);
        ride.setTripStatus(Ride.TripStatus.CANCELLED);
        rideRepository.save(ride);
        
        log.info("Ride {} cancelled successfully by driver", rideId);
    }
    
    /**
     * Process refund through Razorpay
     */
    private void processRefund(Booking booking, RefundCalculation refundCalc, String reason) {
        try {
            com.ridehub.model.Payment payment = paymentRepository.findByBooking(booking)
                    .orElseThrow(() -> new RuntimeException("Payment not found for booking"));
            
            if (payment.getStatus() != com.ridehub.model.Payment.PaymentStatus.COMPLETED) {
                log.warn("Payment not in COMPLETED status, cannot refund. Status: {}", payment.getStatus());
                return;
            }
            
            // Calculate refund amount in paise
            int refundAmountPaise = (int) (refundCalc.getRefundAmount() * 100);
            
            if (refundAmountPaise <= 0) {
                log.info("No refund amount for booking {} (100% penalty)", booking.getId());
                payment.setStatus(com.ridehub.model.Payment.PaymentStatus.REFUNDED);
                paymentRepository.save(payment);
                return;
            }
            
            // Initiate Razorpay refund
            RazorpayClient razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            
            Payment razorpayPayment = razorpayClient.payments.fetch(payment.getRazorpayPaymentId());
            
            JSONObject refundRequest = new JSONObject();
            refundRequest.put("amount", refundAmountPaise);
            refundRequest.put("speed", "normal");
            
            JSONObject notes = new JSONObject();
            notes.put("booking_id", booking.getId());
            notes.put("refund_percentage", refundCalc.getRefundPercentage() * 100);
            notes.put("penalty_percentage", refundCalc.getPenaltyPercentage() * 100);
            notes.put("reason", reason);
            refundRequest.put("notes", notes);
            
            Refund razorpayRefund = razorpayClient.payments.refund(payment.getRazorpayPaymentId(), refundRequest);
            
            payment.setStatus(com.ridehub.model.Payment.PaymentStatus.REFUNDED);
            paymentRepository.save(payment);
            
            log.info("Refund processed successfully. Booking: {}, Refund ID: {}, Amount: ₹{}", 
                    booking.getId(), razorpayRefund.get("id"), refundCalc.getRefundAmount());
            
        } catch (RazorpayException e) {
            log.error("Failed to process refund for booking {}: {}", booking.getId(), e.getMessage());
            throw new RuntimeException("Failed to process refund: " + e.getMessage());
        }
    }
    
    /**
     * Refund calculation result
     */
    @lombok.Data
    @lombok.Builder
    public static class RefundCalculation {
        private double refundPercentage;
        private double penaltyPercentage;
        private double refundAmount;
        private double penaltyAmount;
        private long hoursUntilTrip;
        private String reason;
    }
}
