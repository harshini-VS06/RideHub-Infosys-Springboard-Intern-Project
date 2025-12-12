package com.ridehub.controller;

import com.ridehub.dto.*;
import com.ridehub.model.*;
import com.ridehub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {
    
    private final UserRepository userRepository;
    private final RideRepository rideRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;
    
    // Get all users
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }
    
    // Get all rides
    @GetMapping("/rides")
    public ResponseEntity<List<Ride>> getAllRides() {
        List<Ride> rides = rideRepository.findAll();
        return ResponseEntity.ok(rides);
    }
    
    // Get all bookings
    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAll();
        return ResponseEntity.ok(bookings);
    }
    
    // Get all payments
    @GetMapping("/payments")
    public ResponseEntity<List<PaymentResponse>> getAllPayments() {
        List<Payment> payments = paymentRepository.findAll();
        
        List<PaymentResponse> paymentResponses = payments.stream()
                .map(payment -> PaymentResponse.builder()
                        .id(payment.getId())
                        .bookingId(payment.getBooking() != null ? payment.getBooking().getId() : null)
                        .passengerId(payment.getPassenger() != null ? payment.getPassenger().getId() : null)
                        .passengerName(payment.getPassenger() != null ? payment.getPassenger().getName() : "N/A")
                        .driverId(payment.getDriver() != null ? payment.getDriver().getId() : null)
                        .driverName(payment.getDriver() != null ? payment.getDriver().getName() : "N/A")
                        .razorpayOrderId(payment.getRazorpayOrderId())
                        .razorpayPaymentId(payment.getRazorpayPaymentId())
                        .amount(payment.getAmount())
                        .status(payment.getStatus().toString())
                        .paymentMethod(payment.getRazorpayPaymentId() != null ? "RAZORPAY" : "PENDING")
                        .createdAt(payment.getCreatedAt())
                        .paidAt(payment.getPaidAt())
                        .build())
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(paymentResponses);
    }
    
    // Get all reviews
    @GetMapping("/reviews")
    public ResponseEntity<List<Review>> getAllReviews() {
        List<Review> reviews = reviewRepository.findAll();
        return ResponseEntity.ok(reviews);
    }
    
    // Get dashboard statistics
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalDrivers = userRepository.countByRole(User.Role.DRIVER);
        long totalPassengers = userRepository.countByRole(User.Role.PASSENGER);
        long activeUsers = userRepository.countByActive(true);
        
        long totalRides = rideRepository.count();
        long completedRides = rideRepository.countByStatus(Ride.RideStatus.COMPLETED);
        long cancelledRides = rideRepository.countByStatus(Ride.RideStatus.CANCELLED);
        
        long totalBookings = bookingRepository.count();
        long completedBookings = bookingRepository.countByStatus(Booking.BookingStatus.COMPLETED);
        
        // Calculate total earnings
        List<Booking> completedBookingList = bookingRepository.findByStatus(Booking.BookingStatus.COMPLETED);
        double totalEarnings = completedBookingList.stream()
                .mapToDouble(Booking::getTotalFare)
                .sum();
        
        AdminStatsResponse stats = AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalDrivers(totalDrivers)
                .totalPassengers(totalPassengers)
                .activeUsers(activeUsers)
                .totalRides(totalRides)
                .completedRides(completedRides)
                .cancelledRides(cancelledRides)
                .totalBookings(totalBookings)
                .completedBookings(completedBookings)
                .totalEarnings(totalEarnings)
                .build();
        
        return ResponseEntity.ok(stats);
    }
    
    // Block/Unblock user
    @PutMapping("/users/{userId}/block")
    public ResponseEntity<ApiResponse> blockUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setActive(false);
        userRepository.save(user);
        
        return ResponseEntity.ok(new ApiResponse(true, "User blocked successfully"));
    }
    
    @PutMapping("/users/{userId}/unblock")
    public ResponseEntity<ApiResponse> unblockUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setActive(true);
        userRepository.save(user);
        
        return ResponseEntity.ok(new ApiResponse(true, "User unblocked successfully"));
    }
    
    // Delete user
    @DeleteMapping("/users/{userId}")
    @Transactional
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Delete all user's bookings first
        if (user.getRole() == User.Role.PASSENGER) {
            bookingRepository.deleteByPassengerId(userId);
        }
        
        // Delete all user's rides if driver
        if (user.getRole() == User.Role.DRIVER) {
            List<Ride> rides = rideRepository.findByDriverId(userId);
            for (Ride ride : rides) {
                bookingRepository.deleteByRideId(ride.getId());
            }
            rideRepository.deleteByDriverId(userId);
        }
        
        // Delete reviews (as passenger and as driver)
        reviewRepository.deleteByPassengerId(userId);
        reviewRepository.deleteByDriverId(userId);
        
        // Finally delete user
        userRepository.delete(user);
        
        return ResponseEntity.ok(new ApiResponse(true, "User deleted successfully"));
    }
    
    // Get user details with statistics
    @GetMapping("/users/{userId}/details")
    public ResponseEntity<UserDetailsResponse> getUserDetails(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserDetailsResponse details = new UserDetailsResponse();
        details.setUser(user);
        
        if (user.getRole() == User.Role.DRIVER) {
            long totalRides = rideRepository.countByDriverId(userId);
            long completedRides = rideRepository.countByDriverIdAndStatus(userId, Ride.RideStatus.COMPLETED);
            List<Review> reviews = reviewRepository.findByDriverIdOrderByCreatedAtDesc(userId);
            double avgRating = reviews.stream()
                    .mapToDouble(Review::getRating)
                    .average()
                    .orElse(0.0);
            
            details.setTotalRides(totalRides);
            details.setCompletedRides(completedRides);
            details.setAverageRating(avgRating);
            details.setTotalReviews((long) reviews.size());
        } else {
            long totalBookings = bookingRepository.countByPassengerId(userId);
            long completedBookings = bookingRepository.countByPassengerIdAndStatus(userId, Booking.BookingStatus.COMPLETED);
            List<Review> reviews = reviewRepository.findByPassengerIdOrderByCreatedAtDesc(userId);
            
            details.setTotalBookings(totalBookings);
            details.setCompletedBookings(completedBookings);
            details.setTotalReviews((long) reviews.size());
        }
        
        return ResponseEntity.ok(details);
    }
    
    // Get reviews for a user (driver)
    @GetMapping("/users/{userId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getUserReviews(@PathVariable Long userId) {
        List<Review> reviews = reviewRepository.findByDriverIdOrderByCreatedAtDesc(userId);
        
        List<ReviewResponse> reviewResponses = reviews.stream()
                .map(review -> ReviewResponse.builder()
                        .id(review.getId())
                        .bookingId(review.getBooking().getId())
                        .rideId(review.getRide().getId())
                        .driverId(review.getDriver().getId())
                        .driverName(review.getDriver().getName())
                        .passengerId(review.getPassenger().getId())
                        .passengerName(review.getPassenger().getName())
                        .rating(review.getRating())
                        .comment(review.getComment())
                        .createdAt(review.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(reviewResponses);
    }
}
