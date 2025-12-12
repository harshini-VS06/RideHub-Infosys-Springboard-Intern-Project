package com.ridehub.service;

import com.ridehub.dto.CreateRideRequest;
import com.ridehub.dto.RideResponse;
import com.ridehub.model.Ride;
import com.ridehub.model.User;
import com.ridehub.repository.BookingRepository;
import com.ridehub.repository.ReviewRepository;
import com.ridehub.repository.RideRepository;
import com.ridehub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RideService {
    
    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final EmailService emailService;
    private final GeospatialService geospatialService;
    private final RefundService refundService;
    private final NotificationService notificationService;
    private final WalletService walletService;
    private final ReviewRepository reviewRepository;
    
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    @Transactional
    public RideResponse createRide(CreateRideRequest request) {
        User driver = getCurrentUser();
        
        if (driver.getRole() != User.Role.DRIVER) {
            throw new RuntimeException("Only drivers can create rides");
        }
        
        log.info("[RideService] Creating ride:");
        log.info("  Driver: {}", driver.getName());
        log.info("  Source: '{}'", request.getSource());
        log.info("  Destination: '{}'", request.getDestination());
        log.info("  Date: {}", request.getRideDate());
        log.info("  Coordinates: ({}, {}) -> ({}, {})", 
            request.getSourceLat(), request.getSourceLng(),
            request.getDestLat(), request.getDestLng());
        
        Ride ride = Ride.builder()
                .driver(driver)
                .source(request.getSource())
                .destination(request.getDestination())
                .rideDate(LocalDate.parse(request.getRideDate()))
                .rideTime(LocalTime.parse(request.getRideTime()))
                .totalSeats(request.getTotalSeats())
                .availableSeats(request.getTotalSeats())
                .farePerKm(request.getFarePerKm())
                .distance(request.getDistance())
                .sourceLat(request.getSourceLat())
                .sourceLng(request.getSourceLng())
                .destLat(request.getDestLat())
                .destLng(request.getDestLng())
                .status(Ride.RideStatus.AVAILABLE)
                .build();
        
        ride = rideRepository.save(ride);
        log.info("[RideService] Ride created successfully with ID: {}", ride.getId());
        
        // Send confirmation email to driver
        emailService.sendRideCreationEmail(driver, ride);
        
        return mapToRideResponse(ride);
    }
    
    @Transactional(readOnly = true)
    public List<RideResponse> getMyRides() {
        User driver = getCurrentUser();
        List<Ride> rides = rideRepository.findByDriverOrderByRideDateDesc(driver);
        return rides.stream().map(this::mapToRideResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<RideResponse> searchRides(String source, String destination, String date) {
        log.info("[RideService] Searching rides with source='{}', destination='{}', date='{}'", source, destination, date);
        
        LocalDate rideDate = LocalDate.parse(date);
        List<Ride> rides = rideRepository.findAvailableRides(source, destination, rideDate);
        
        log.info("[RideService] Found {} rides", rides.size());
        if (rides.isEmpty()) {
            log.warn("[RideService] No rides found. Check if:");
            log.warn("  - Rides exist for date: {}", rideDate);
            log.warn("  - Source contains: {}", source);
            log.warn("  - Destination contains: {}", destination);
        } else {
            rides.forEach(ride -> log.info("  Found: {} -> {} on {}", 
                ride.getSource(), ride.getDestination(), ride.getRideDate()));
        }
        
        return rides.stream().map(this::mapToRideResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<RideResponse> getAvailableRides() {
        LocalDate currentDate = LocalDate.now();
        List<Ride> rides = rideRepository.findAllAvailableRides(currentDate);
        return rides.stream().map(this::mapToRideResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<RideResponse> getAvailableRidesByGender(String gender) {
        LocalDate currentDate = LocalDate.now();
        List<Ride> rides = rideRepository.findAvailableRidesByDriverGender(gender, currentDate);
        return rides.stream().map(this::mapToRideResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public RideResponse getRideById(Long id) {
        Ride ride = rideRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        return mapToRideResponse(ride);
    }
    
    @Transactional
    public void updateRideSeats(Long rideId, Integer seatsBooked) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        
        if (ride.getAvailableSeats() < seatsBooked) {
            throw new RuntimeException("Not enough seats available");
        }
        
        ride.setAvailableSeats(ride.getAvailableSeats() - seatsBooked);
        
        if (ride.getAvailableSeats() == 0) {
            ride.setStatus(Ride.RideStatus.FULL);
        }
        
        rideRepository.save(ride);
    }
    
    /**
     * Search for rides with smart matching algorithm
     * Filters rides where passenger's pickup and drop points lie along driver's route
     */
    @Transactional(readOnly = true)
    public List<RideResponse> searchRidesWithRouteMatching(
            String source, String destination, String date,
            Double pickupLat, Double pickupLng,
            Double dropLat, Double dropLng) {
        
        log.info("Smart route matching: source={}, dest={}, date={}", source, destination, date);
        log.info("Pickup coords: ({}, {}), Drop coords: ({}, {})", pickupLat, pickupLng, dropLat, dropLng);
        
        LocalDate rideDate = LocalDate.parse(date);
        
        // First, get rides that match source and destination exactly
        List<Ride> exactMatches = rideRepository.findAvailableRides(source, destination, rideDate);
        log.info("Found {} exact matches", exactMatches.size());
        
        // Then, get all available rides for the date to check enroute matches
        List<Ride> allRides = rideRepository.findAllAvailableRides(rideDate);
        log.info("Checking {} total rides for enroute matches", allRides.size());
        
        // Combine exact matches with enroute matches
        List<Ride> matchingRides = allRides.stream()
                .filter(ride -> {
                    // Skip if already in exact matches
                    if (exactMatches.stream().anyMatch(r -> r.getId().equals(ride.getId()))) {
                        return true;
                    }
                    
                    // Check if passenger's points lie along driver's route
                    if (ride.getSourceLat() != null && ride.getSourceLng() != null &&
                        ride.getDestLat() != null && ride.getDestLng() != null) {
                        
                        boolean matches = geospatialService.doPointsMatchRoute(
                            pickupLat, pickupLng,
                            dropLat, dropLng,
                            ride.getSourceLat(), ride.getSourceLng(),
                            ride.getDestLat(), ride.getDestLng()
                        );
                        
                        if (matches) {
                            log.info("Enroute match found: Ride #{} ({} -> {})", 
                                ride.getId(), ride.getSource(), ride.getDestination());
                        }
                        
                        return matches;
                    }
                    return false;
                })
                .distinct()
                .collect(Collectors.toList());
        
        log.info("Total matching rides (exact + enroute): {}", matchingRides.size());
        return matchingRides.stream()
                .map(this::mapToRideResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Atomically update ride seats - ensures thread-safe seat management
     */
    @Transactional
    public synchronized void updateRideSeatsCancellation(Long rideId, Integer seatsToRestore) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        
        ride.setAvailableSeats(ride.getAvailableSeats() + seatsToRestore);
        
        if (ride.getStatus() == Ride.RideStatus.FULL) {
            ride.setStatus(Ride.RideStatus.AVAILABLE);
        }
        
        rideRepository.save(ride);
    }
    
    /**
     * Cancel a ride by driver
     * - Cancels all associated bookings
     * - Sends email notifications to all passengers
     * - Processes refunds for paid bookings
     */
    @Transactional
    public void cancelRide(Long rideId) {
        User driver = getCurrentUser();
        
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        
        // Verify ownership
        if (!ride.getDriver().getId().equals(driver.getId())) {
            throw new RuntimeException("You can only cancel your own rides");
        }
        
        if (ride.getStatus() == Ride.RideStatus.CANCELLED) {
            throw new RuntimeException("Ride is already cancelled");
        }
        
        // Get all bookings for this ride
        List<com.ridehub.model.Booking> bookings = bookingRepository.findByRideOrderByBookedAtDesc(ride);
        
        log.info("Cancelling ride #{} with {} bookings", rideId, bookings.size());
        
        // Cancel all bookings and process refunds
        for (com.ridehub.model.Booking booking : bookings) {
            if (booking.getStatus() != com.ridehub.model.Booking.BookingStatus.CANCELLED) {
                // Update booking status
                booking.setStatus(com.ridehub.model.Booking.BookingStatus.CANCELLED);
                bookingRepository.save(booking);
                
                // Process refund if payment was made
                if (booking.getStatus() == com.ridehub.model.Booking.BookingStatus.CONFIRMED || 
                    booking.getPaidAt() != null) {
                    try {
                        refundService.processRefund(booking);
                        log.info("Refund processed for booking #{}", booking.getId());
                    } catch (Exception e) {
                        log.error("Failed to process refund for booking #{}: {}", booking.getId(), e.getMessage());
                    }
                }
                
                // Send cancellation email to passenger
                try {
                    emailService.sendRideCancellationEmail(booking.getPassenger(), booking, ride, driver);
                    log.info("Cancellation email sent to passenger: {}", booking.getPassenger().getEmail());
                } catch (Exception e) {
                    log.error("Failed to send cancellation email to {}: {}", 
                        booking.getPassenger().getEmail(), e.getMessage());
                }
                
                // Send notification
                try {
                    notificationService.sendRideCancellationNotification(booking.getPassenger(), booking, "Ride cancelled by driver");
                } catch (Exception e) {
                    log.error("Failed to send notification: {}", e.getMessage());
                }
            }
        }
        
        // Update ride status
        ride.setStatus(Ride.RideStatus.CANCELLED);
        rideRepository.save(ride);
        
        log.info("Ride #{} cancelled successfully", rideId);
    }
    
    private RideResponse mapToRideResponse(Ride ride) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        
        // Get driver rating
        Double driverRating = reviewRepository.getAverageRatingForDriver(ride.getDriver().getId());
        Long totalReviews = reviewRepository.countReviewsForDriver(ride.getDriver().getId());
        
        return RideResponse.builder()
                .id(ride.getId())
                .source(ride.getSource())
                .destination(ride.getDestination())
                .rideDate(ride.getRideDate().format(dateFormatter))
                .rideTime(ride.getRideTime().format(timeFormatter))
                .totalSeats(ride.getTotalSeats())
                .availableSeats(ride.getAvailableSeats())
                .farePerKm(ride.getFarePerKm())
                .distance(ride.getDistance())
                .sourceLat(ride.getSourceLat())
                .sourceLng(ride.getSourceLng())
                .destLat(ride.getDestLat())
                .destLng(ride.getDestLng())
                .status(ride.getStatus().name())
                .driver(ride.getDriver().getName())
                .driverGender(ride.getDriver().getGender())
                .car(ride.getDriver().getCarModel())
                .licensePlate(ride.getDriver().getLicensePlate())
                .driverId(ride.getDriver().getId())
                .driverAverageRating(driverRating != null ? Math.round(driverRating * 10.0) / 10.0 : null)
                .driverTotalReviews(totalReviews != null ? totalReviews : 0L)
                .build();
    }
    
    @Transactional
    public void startRide(Long bookingId) {
        User currentUser = getCurrentUser();
        
        com.ridehub.model.Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        // Check if user is driver or passenger
        boolean isDriver = booking.getRide().getDriver().getId().equals(currentUser.getId());
        boolean isPassenger = booking.getPassenger().getId().equals(currentUser.getId());
        
        if (!isDriver && !isPassenger) {
            throw new RuntimeException("Unauthorized: You are not part of this booking");
        }
        
        // Check booking status
        if (booking.getStatus() != com.ridehub.model.Booking.BookingStatus.CONFIRMED) {
            throw new RuntimeException("Booking must be confirmed to start ride");
        }
        
        // Update the appropriate flag
        if (isDriver) {
            booking.setDriverStartedRide(true);
            log.info("Driver started ride for booking #{}", bookingId);
        } else {
            booking.setPassengerStartedRide(true);
            log.info("Passenger started ride for booking #{}", bookingId);
        }
        
        // If both have started, set the ride start timestamp
        if (booking.getDriverStartedRide() && booking.getPassengerStartedRide() && booking.getRideStartedAt() == null) {
            booking.setRideStartedAt(LocalDateTime.now());
            booking.setStatus(com.ridehub.model.Booking.BookingStatus.ONBOARDED);
            log.info("Both driver and passenger confirmed start. Ride officially started for booking #{}", bookingId);
            
            // Update ride trip status
            Ride ride = booking.getRide();
            if (ride.getTripStatus() == Ride.TripStatus.SCHEDULED) {
                ride.setTripStatus(Ride.TripStatus.IN_PROGRESS);
                ride.setTripStartedAt(LocalDateTime.now());
                rideRepository.save(ride);
            }
            
            // Send emails to both driver and passenger when ride starts
            try {
                emailService.sendRideStartedEmailToDriver(ride.getDriver(), ride, booking);
                emailService.sendRideStartedEmailToPassenger(booking.getPassenger(), ride, booking);
                log.info("Ride start emails sent to driver and passenger for booking #{}", bookingId);
            } catch (Exception e) {
                log.error("Failed to send ride start emails: {}", e.getMessage());
            }
        }
        
        bookingRepository.save(booking);
    }
    
    @Transactional
    public void endRide(Long bookingId) {
        User currentUser = getCurrentUser();
        
        com.ridehub.model.Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        // Only passenger can end the ride
        if (!booking.getPassenger().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only passenger can end the ride");
        }
        
        // Check if ride was started by both
        if (!booking.getDriverStartedRide() || !booking.getPassengerStartedRide()) {
            throw new RuntimeException("Ride must be started by both driver and passenger first");
        }
        
        // Check if already ended
        if (booking.getRideEndedAt() != null) {
            throw new RuntimeException("Ride has already been ended");
        }
        
        // End the ride
        booking.setRideEndedAt(LocalDateTime.now());
        booking.setDeboardedAt(LocalDateTime.now());
        booking.setStatus(com.ridehub.model.Booking.BookingStatus.COMPLETED);
        bookingRepository.save(booking);
        
        log.info("Ride ended for booking #{}", bookingId);
        
        // Send emails to both driver and passenger when ride ends
        try {
            Ride ride = booking.getRide();
            emailService.sendRideEndedEmailToDriver(ride.getDriver(), ride, booking);
            emailService.sendRideEndedEmailToPassenger(booking.getPassenger(), ride, booking);
            log.info("Ride end emails sent to driver and passenger for booking #{}", bookingId);
        } catch (Exception e) {
            log.error("Failed to send ride end emails: {}", e.getMessage());
        }
        
        // Transfer locked balance to available balance IMMEDIATELY
        walletService.releaseLockedFunds(booking);
        log.info("✓ Locked funds released to available balance for booking #{}", bookingId);
        
        // Check if all bookings for this ride are completed
        Ride ride = booking.getRide();
        List<com.ridehub.model.Booking> allBookings = bookingRepository.findByRideOrderByBookedAtDesc(ride);
        boolean allCompleted = allBookings.stream()
                .allMatch(b -> b.getStatus() == com.ridehub.model.Booking.BookingStatus.COMPLETED || 
                              b.getStatus() == com.ridehub.model.Booking.BookingStatus.CANCELLED);
        
        if (allCompleted) {
            ride.setStatus(Ride.RideStatus.COMPLETED);
            ride.setTripStatus(Ride.TripStatus.COMPLETED);
            ride.setTripCompletedAt(LocalDateTime.now());
            rideRepository.save(ride);
            log.info("All bookings completed. Ride #{} marked as completed", ride.getId());
        }
    }
}
