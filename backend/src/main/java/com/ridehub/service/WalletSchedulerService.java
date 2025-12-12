package com.ridehub.service;

import com.ridehub.model.Booking;
import com.ridehub.model.Payment;
import com.ridehub.repository.BookingRepository;
import com.ridehub.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled service to automatically release locked funds for completed rides
 * Runs every hour to check for completed bookings and release their funds
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WalletSchedulerService {
    
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final WalletService walletService;
    
    /**
     * Runs every 5 minutes to release locked funds for completed rides
     * Cron: 0 0/5 * * * * = Every 5 minutes
     * This is a safety net in case immediate release fails
     */
    @Scheduled(cron = "0 0/5 * * * *")
    @Transactional
    public void releaseCompletedRideFunds() {
        log.info("=== Starting scheduled wallet fund release ===");
        LocalDateTime now = LocalDateTime.now();
        
        try {
            // Find all COMPLETED bookings that haven't had their funds released yet
            List<Booking> completedBookings = bookingRepository.findCompletedBookingsWithLockedFunds();
            
            if (completedBookings.isEmpty()) {
                log.info("No completed bookings with locked funds found");
                return;
            }
            
            log.info("Found {} completed bookings to process", completedBookings.size());
            
            int successCount = 0;
            int failureCount = 0;
            
            for (Booking booking : completedBookings) {
                try {
                    // Double-check booking is actually completed
                    if (booking.getStatus() != Booking.BookingStatus.COMPLETED 
                        && booking.getStatus() != Booking.BookingStatus.DEBOARDED) {
                        log.warn("Skipping booking #{} - status is {}", booking.getId(), booking.getStatus());
                        continue;
                    }
                    
                    // Verify payment exists and is completed
                    Payment payment = paymentRepository.findByBooking(booking)
                            .orElse(null);
                    
                    if (payment == null) {
                        log.warn("No payment found for booking #{}", booking.getId());
                        continue;
                    }
                    
                    if (payment.getStatus() != Payment.PaymentStatus.COMPLETED) {
                        log.warn("Payment for booking #{} is not completed (status: {})", 
                                booking.getId(), payment.getStatus());
                        continue;
                    }
                    
                    // Release the locked funds
                    log.info("Releasing funds for booking #{} (₹{})", booking.getId(), payment.getAmount());
                    walletService.releaseLockedFunds(booking);
                    
                    successCount++;
                    log.info("✓ Successfully released funds for booking #{}", booking.getId());
                    
                } catch (Exception e) {
                    failureCount++;
                    log.error("✗ Failed to release funds for booking #{}: {}", 
                            booking.getId(), e.getMessage(), e);
                }
            }
            
            log.info("=== Scheduled fund release completed ===");
            log.info("Success: {}, Failures: {}", successCount, failureCount);
            
        } catch (Exception e) {
            log.error("Error in scheduled fund release: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Manual trigger endpoint - can be called to force immediate processing
     * Use this if you need to release funds outside of the scheduled time
     */
    @Transactional
    public String manualReleaseCompletedRideFunds() {
        log.info("=== Manual fund release triggered ===");
        
        try {
            releaseCompletedRideFunds();
            return "Manual fund release completed successfully";
        } catch (Exception e) {
            log.error("Manual fund release failed: {}", e.getMessage(), e);
            return "Manual fund release failed: " + e.getMessage();
        }
    }
}
