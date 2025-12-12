package com.ridehub.service;

import com.ridehub.dto.BookingRequest;
import com.ridehub.dto.BookingResponse;
import com.ridehub.model.Booking;
import com.ridehub.model.Ride;
import com.ridehub.model.User;
import com.ridehub.repository.BookingRepository;
import com.ridehub.repository.RideRepository;
import com.ridehub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {
    
    private final BookingRepository bookingRepository;
    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final RideService rideService;
    private final EmailService emailService;
    private final GeospatialService geospatialService;
    private final NotificationService notificationService;
    
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        User passenger = getCurrentUser();
        
        if (passenger.getRole() != User.Role.PASSENGER) {
            throw new RuntimeException("Only passengers can book rides");
        }
        
        Ride ride = rideRepository.findById(request.getRideId())
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        
        if (ride.getAvailableSeats() < request.getSeatsBooked()) {
            throw new RuntimeException("Not enough seats available");
        }
        
        // Calculate segment distance using geospatial service
        double segmentDistance = geospatialService.calculateSegmentDistance(
            request.getPickupLat(), request.getPickupLng(),
            request.getDropLat(), request.getDropLng()
        );
        
        // Calculate total trip cost (full route distance * fare per km)
        double totalTripCost = ride.getDistance() * ride.getFarePerKm();
        
        // Calculate maximum price (if passenger is the only one)
        double maximumPrice = totalTripCost * request.getSeatsBooked();
        
        // Calculate payment due date (24 hours before ride start)
        LocalDateTime rideDateTime = LocalDateTime.of(ride.getRideDate(), ride.getRideTime());
        LocalDateTime paymentDueAt = rideDateTime.minusHours(24);
        
        // Create tentative booking with ALL required fields explicitly set
        Booking booking = Booking.builder()
                .ride(ride)
                .passenger(passenger)
                .seatsBooked(request.getSeatsBooked())
                .pickupLocation(request.getPickupLocation())
                .dropLocation(request.getDropLocation())
                .segmentDistance(segmentDistance)
                .pickupLat(request.getPickupLat())
                .pickupLng(request.getPickupLng())
                .dropLat(request.getDropLat())
                .dropLng(request.getDropLng())
                .totalTripCost(totalTripCost)
                .maximumPrice(maximumPrice)
                .totalFare(maximumPrice)  // CRITICAL FIX: Set totalFare to satisfy NOT NULL constraint
                .status(Booking.BookingStatus.TENTATIVE)
                .paymentDueAt(paymentDueAt)
                .initialEmailSent(false)  // EXPLICITLY SET - Required field
                .paymentRequestSent(false)  // EXPLICITLY SET - Required field
                .build();
        
        booking = bookingRepository.save(booking);
        
        // Update ride seats
        rideService.updateRideSeats(ride.getId(), request.getSeatsBooked());
        
        // Send initial booking email explaining price sharing logic
        emailService.sendInitialBookingEmail(passenger, booking, ride);
        booking.setInitialEmailSent(true);
        bookingRepository.save(booking);
        
        // Send WebSocket notification
        notificationService.sendBookingConfirmationNotification(passenger, booking);
        
        // Send notification to driver about tentative booking
        emailService.sendDriverBookingNotification(ride.getDriver(), passenger, booking, ride);
        
        return mapToBookingResponse(booking);
    }
    
    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            System.out.println("[BookingService] Fetching bookings for user: " + email);
            
            User passenger = userRepository.findByEmail(email)
                    .orElseThrow(() -> {
                        System.err.println("[BookingService] User not found with email: " + email);
                        return new RuntimeException("User not found with email: " + email);
                    });
            
            System.out.println("[BookingService] User found: " + passenger.getName() + " (ID: " + passenger.getId() + ")");
            
            List<Booking> bookings = bookingRepository.findByPassengerOrderByBookedAtDesc(passenger);
            System.out.println("[BookingService] Found " + bookings.size() + " bookings");
            
            return bookings.stream().map(this::mapToBookingResponse).collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("[BookingService] Error in getMyBookings: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    @Transactional(readOnly = true)
    public List<BookingResponse> getRideBookings(Long rideId) {
        User driver = getCurrentUser();
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        
        if (!ride.getDriver().getId().equals(driver.getId())) {
            throw new RuntimeException("You can only view bookings for your own rides");
        }
        
        List<Booking> bookings = bookingRepository.findByRideOrderByBookedAtDesc(ride);
        return bookings.stream().map(this::mapToBookingResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        User currentUser = getCurrentUser();
        if (!booking.getPassenger().getId().equals(currentUser.getId()) && 
            !booking.getRide().getDriver().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized access to booking");
        }
        
        return mapToBookingResponse(booking);
    }
    
    @Transactional
    public void cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        User currentUser = getCurrentUser();
        if (!booking.getPassenger().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only cancel your own bookings");
        }
        
        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking is already cancelled");
        }
        
        Ride ride = booking.getRide();
        User driver = ride.getDriver();
        
        // Update booking status
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        
        // Restore seats to ride using atomic operation
        rideService.updateRideSeatsCancellation(ride.getId(), booking.getSeatsBooked());
        
        // Send email notification to driver
        try {
            emailService.sendBookingCancellationToDriver(driver, currentUser, booking, ride);
        } catch (Exception e) {
            // Log error but don't fail the cancellation
            System.err.println("Failed to send cancellation email to driver: " + e.getMessage());
        }
        
        // Send notification to driver
        try {
            notificationService.sendBookingCancellationNotification(driver, booking);
        } catch (Exception e) {
            System.err.println("Failed to send cancellation notification: " + e.getMessage());
        }
    }
    
    private BookingResponse mapToBookingResponse(Booking booking) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        Ride ride = booking.getRide();
        
        return BookingResponse.builder()
                .id(booking.getId())
                .rideId(ride.getId())
                .source(ride.getSource())
                .destination(ride.getDestination())
                .rideDate(ride.getRideDate().format(dateFormatter))
                .rideTime(ride.getRideTime().format(timeFormatter))
                .seatsBooked(booking.getSeatsBooked())
                .pickupLocation(booking.getPickupLocation())
                .dropLocation(booking.getDropLocation())
                .segmentDistance(booking.getSegmentDistance())
                .totalFare(booking.getMaximumPrice()) // For backward compatibility
                .maximumPrice(booking.getMaximumPrice())
                .finalPrice(booking.getFinalPrice())
                .totalTripCost(booking.getTotalTripCost())
                .status(booking.getStatus().name())
                .bookedAt(booking.getBookedAt().format(dateTimeFormatter))
                .paymentDueAt(booking.getPaymentDueAt() != null ? booking.getPaymentDueAt().format(dateTimeFormatter) : null)
                .paidAt(booking.getPaidAt() != null ? booking.getPaidAt().format(dateTimeFormatter) : null)
                .driver(ride.getDriver().getName())
                .driverGender(ride.getDriver().getGender())
                .car(ride.getDriver().getCarModel())
                .licensePlate(ride.getDriver().getLicensePlate())
                .driverContact(ride.getDriver().getContact())
                .passengerName(booking.getPassenger().getName())
                .passengerContact(booking.getPassenger().getContact())
                .build();
    }
}
