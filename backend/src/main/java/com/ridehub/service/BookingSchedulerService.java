package com.ridehub.service;

import com.ridehub.model.Booking;
import com.ridehub.model.Ride;
import com.ridehub.model.User;
import com.ridehub.repository.BookingRepository;
import com.ridehub.repository.RideRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingSchedulerService {
    
    private final BookingRepository bookingRepository;
    private final RideRepository rideRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    
    // Run every 2 minutes for more responsive payment processing
    @Scheduled(cron = "0 */2 * * * *")
    @Transactional
    public void processPaymentRequests() {
        log.info("Starting payment request processing...");
        
        LocalDateTime now = LocalDateTime.now();
        List<Booking> bookings = bookingRepository.findBookingsNeedingPaymentRequest(now);
        
        log.info("Found {} bookings needing payment request", bookings.size());
        
        for (Booking booking : bookings) {
            try {
                processBookingPaymentRequest(booking);
            } catch (Exception e) {
                log.error("Error processing payment request for booking {}: {}", 
                        booking.getId(), e.getMessage());
            }
        }
        
        log.info("Payment request processing completed");
    }
    
    @Transactional
    public void processBookingPaymentRequest(Booking booking) {
        Ride ride = booking.getRide();
        
        // Calculate final price based on all active bookings
        List<Booking> activeBookings = bookingRepository.findActiveBookingsByRide(ride);
        
        int totalBookedSeats = activeBookings.stream()
                .mapToInt(Booking::getSeatsBooked)
                .sum();
        
        // Calculate final seat rate
        double finalSeatRate = booking.getTotalTripCost() / totalBookedSeats;
        double finalPrice = finalSeatRate * booking.getSeatsBooked();
        
        // Update booking
        booking.setFinalPrice(finalPrice);
        booking.setStatus(Booking.BookingStatus.PAYMENT_PENDING);
        booking.setPaymentRequestSent(true);
        bookingRepository.save(booking);
        
        // Send notifications and emails
        notificationService.sendPaymentRequestNotification(booking.getPassenger(), booking);
        emailService.sendPaymentRequestEmail(booking.getPassenger(), booking, finalSeatRate, totalBookedSeats);
        
        log.info("Payment request sent for booking {}: Final price ₹{}", 
                booking.getId(), finalPrice);
    }
    
    // Run every hour to mark past rides as completed
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void markPastRidesAsCompleted() {
        log.info("Starting to mark past rides as completed...");
        
        LocalDateTime now = LocalDateTime.now();
        
        // Find all rides that have passed their scheduled time
        List<Ride> pastRides = rideRepository.findAll().stream()
                .filter(ride -> {
                    LocalDateTime rideDateTime = LocalDateTime.of(ride.getRideDate(), ride.getRideTime());
                    // If ride time was more than 2 hours ago
                    return rideDateTime.plusHours(2).isBefore(now) &&
                           (ride.getStatus() == Ride.RideStatus.AVAILABLE ||
                            ride.getStatus() == Ride.RideStatus.FULL ||
                            ride.getTripStatus() == Ride.TripStatus.IN_PROGRESS ||
                            ride.getTripStatus() == Ride.TripStatus.SCHEDULED);
                })
                .collect(Collectors.toList());
        
        log.info("Found {} past rides to mark as completed", pastRides.size());
        
        for (Ride ride : pastRides) {
            try {
                // Update ride status
                ride.setStatus(Ride.RideStatus.COMPLETED);
                if (ride.getTripStatus() != Ride.TripStatus.COMPLETED) {
                    ride.setTripStatus(Ride.TripStatus.COMPLETED);
                    ride.setTripCompletedAt(LocalDateTime.now());
                }
                rideRepository.save(ride);
                
                // Mark all confirmed bookings as completed if not already
                List<Booking> bookings = bookingRepository.findByRideOrderByBookedAtDesc(ride);
                for (Booking booking : bookings) {
                    if (booking.getStatus() == Booking.BookingStatus.CONFIRMED) {
                        booking.setStatus(Booking.BookingStatus.COMPLETED);
                        if (booking.getRideEndedAt() == null) {
                            booking.setRideEndedAt(LocalDateTime.now());
                        }
                        if (booking.getDeboardedAt() == null) {
                            booking.setDeboardedAt(LocalDateTime.now());
                        }
                        bookingRepository.save(booking);
                        
                        log.info("Booking {} marked as completed", booking.getId());
                    }
                }
                
                log.info("Ride {} marked as completed", ride.getId());
            } catch (Exception e) {
                log.error("Error marking ride {} as completed: {}", ride.getId(), e.getMessage());
            }
        }
        
        log.info("Past rides marking completed");
    }
    
    // Run every 10 minutes to check for rides starting in 1 hour
    @Scheduled(cron = "0 */10 * * * *")
    @Transactional
    public void processOneHourWarnings() {
        log.info("Starting 1-hour warning check...");
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneHourFromNow = now.plusHours(1);
        LocalDateTime oneHourTenMinutesFromNow = now.plusHours(1).plusMinutes(10);
        
        // Find all rides starting in approximately 1 hour (with 10-minute window)
        List<Ride> upcomingRides = rideRepository.findAll().stream()
                .filter(ride -> {
                    LocalDateTime rideDateTime = LocalDateTime.of(ride.getRideDate(), ride.getRideTime());
                    return rideDateTime.isAfter(oneHourFromNow) && 
                           rideDateTime.isBefore(oneHourTenMinutesFromNow) &&
                           ride.getStatus() != Ride.RideStatus.CANCELLED &&
                           ride.getStatus() != Ride.RideStatus.COMPLETED;
                })
                .collect(Collectors.toList());
        
        log.info("Found {} rides starting in ~1 hour", upcomingRides.size());
        
        for (Ride ride : upcomingRides) {
            try {
                processOneHourWarningForRide(ride);
            } catch (Exception e) {
                log.error("Error processing 1-hour warning for ride {}: {}", 
                        ride.getId(), e.getMessage());
            }
        }
        
        log.info("1-hour warning check completed");
    }
    
    @Transactional
    public void processOneHourWarningForRide(Ride ride) {
        // Check if ride has not been cancelled and has not been initiated
        if (ride.getStatus() == Ride.RideStatus.CANCELLED || 
            ride.getStatus() == Ride.RideStatus.COMPLETED) {
            return;
        }
        
        // Get all confirmed bookings for this ride
        List<Booking> confirmedBookings = bookingRepository.findByRideOrderByBookedAtDesc(ride).stream()
                .filter(booking -> booking.getStatus() == Booking.BookingStatus.CONFIRMED)
                .collect(Collectors.toList());
        
        if (confirmedBookings.isEmpty()) {
            log.info("No confirmed bookings for ride {}, skipping 1-hour warning", ride.getId());
            return;
        }
        
        // Get list of all passengers
        List<User> passengers = confirmedBookings.stream()
                .map(Booking::getPassenger)
                .distinct()
                .collect(Collectors.toList());
        
        // Send warnings to driver and all passengers
        User driver = ride.getDriver();
        
        // Use the first booking for notification context (all have same ride)
        Booking representativeBooking = confirmedBookings.get(0);
        
        // Send WebSocket notifications
        notificationService.sendOneHourWarningToAll(driver, passengers, representativeBooking);
        
        // Send email notifications
        emailService.sendOneHourWarningEmail(driver, ride, "DRIVER");
        for (User passenger : passengers) {
            emailService.sendOneHourWarningEmail(passenger, ride, "PASSENGER");
        }
        
        log.info("1-hour warnings sent for ride {}: {} passengers notified", 
                ride.getId(), passengers.size());
    }
}
