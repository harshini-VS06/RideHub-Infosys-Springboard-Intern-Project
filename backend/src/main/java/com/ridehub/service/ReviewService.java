package com.ridehub.service;

import com.ridehub.dto.DriverRatingResponse;
import com.ridehub.dto.ReviewRequest;
import com.ridehub.dto.ReviewResponse;
import com.ridehub.model.Booking;
import com.ridehub.model.Review;
import com.ridehub.model.Ride;
import com.ridehub.model.User;
import com.ridehub.repository.BookingRepository;
import com.ridehub.repository.ReviewRepository;
import com.ridehub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {
    
    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    @Transactional
    public ReviewResponse submitReview(ReviewRequest request) {
        User passenger = getCurrentUser();
        log.info("Submitting review for booking {} by passenger {}", request.getBookingId(), passenger.getId());
        
        // Fetch booking with all necessary data
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        // Verify passenger owns this booking
        if (!booking.getPassenger().getId().equals(passenger.getId())) {
            throw new RuntimeException("You can only review your own bookings");
        }
        
        // Verify booking is completed or deboarded
        if (booking.getStatus() != Booking.BookingStatus.COMPLETED 
            && booking.getStatus() != Booking.BookingStatus.DEBOARDED) {
            throw new RuntimeException("You can only review completed rides");
        }
        
        // Check if review already exists
        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new RuntimeException("You have already reviewed this ride");
        }
        
        // Create review
        Review review = Review.builder()
                .booking(booking)
                .ride(booking.getRide())
                .driver(booking.getRide().getDriver())
                .passenger(booking.getPassenger())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();
        
        Review savedReview = reviewRepository.save(review);
        log.info("Review submitted successfully: {}", savedReview.getId());
        
        return mapToReviewResponse(savedReview);
    }
    
    @Transactional(readOnly = true)
    public ReviewResponse getReviewByBookingId(Long bookingId) {
        Review review = reviewRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new RuntimeException("Review not found for this booking"));
        return mapToReviewResponse(review);
    }
    
    @Transactional(readOnly = true)
    public List<ReviewResponse> getDriverReviews(Long driverId) {
        return reviewRepository.findByDriverIdOrderByCreatedAtDesc(driverId)
                .stream()
                .map(this::mapToReviewResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ReviewResponse> getPassengerReviews(Long passengerId) {
        return reviewRepository.findByPassengerIdOrderByCreatedAtDesc(passengerId)
                .stream()
                .map(this::mapToReviewResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public DriverRatingResponse getDriverRating(Long driverId) {
        Double averageRating = reviewRepository.getAverageRatingForDriver(driverId);
        Long totalReviews = reviewRepository.countReviewsForDriver(driverId);
        List<Object[]> distribution = reviewRepository.getRatingDistributionForDriver(driverId);
        
        Map<Integer, Long> ratingDistribution = new HashMap<>();
        for (Object[] row : distribution) {
            Integer rating = (Integer) row[0];
            Long count = (Long) row[1];
            ratingDistribution.put(rating, count);
        }
        
        // Initialize all ratings (1-5) with 0 if not present
        for (int i = 1; i <= 5; i++) {
            ratingDistribution.putIfAbsent(i, 0L);
        }
        
        return DriverRatingResponse.builder()
                .driverId(driverId)
                .averageRating(averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : 0.0)
                .totalReviews(totalReviews != null ? totalReviews : 0L)
                .ratingDistribution(ratingDistribution)
                .build();
    }
    
    @Transactional(readOnly = true)
    public boolean hasReviewedBooking(Long bookingId) {
        return reviewRepository.existsByBookingId(bookingId);
    }
    
    @Transactional(readOnly = true)
    public List<ReviewResponse> getRideReviews(Long rideId) {
        return reviewRepository.findByRideIdOrderByCreatedAtDesc(rideId)
                .stream()
                .map(this::mapToReviewResponse)
                .collect(Collectors.toList());
    }
    
    private ReviewResponse mapToReviewResponse(Review review) {
        Booking booking = review.getBooking();
        Ride ride = review.getRide();
        User driver = review.getDriver();
        User passenger = review.getPassenger();
        
        return ReviewResponse.builder()
                .id(review.getId())
                .bookingId(booking.getId())
                .rideId(ride.getId())
                .driverId(driver.getId())
                .driverName(driver.getName())
                .passengerId(passenger.getId())
                .passengerName(passenger.getName())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .source(ride.getSource())
                .destination(ride.getDestination())
                .rideDate(ride.getRideDate().toString())
                .build();
    }
}
