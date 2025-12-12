package com.ridehub.controller;

import com.ridehub.dto.ApiResponse;
import com.ridehub.dto.DriverRatingResponse;
import com.ridehub.dto.ReviewRequest;
import com.ridehub.dto.ReviewResponse;
import com.ridehub.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ReviewController {
    
    private final ReviewService reviewService;
    
    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<ReviewResponse>> submitReview(
            @Valid @RequestBody ReviewRequest request) {
        try {
            ReviewResponse response = reviewService.submitReview(request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Review submitted successfully", response));
        } catch (Exception e) {
            log.error("Error submitting review", e);
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
    
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<ReviewResponse>> getReviewByBooking(
            @PathVariable Long bookingId) {
        try {
            ReviewResponse response = reviewService.getReviewByBookingId(bookingId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Review retrieved successfully", response));
        } catch (Exception e) {
            log.error("Error getting review for booking {}", bookingId, e);
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
    
    @GetMapping("/booking/{bookingId}/exists")
    public ResponseEntity<ApiResponse<Boolean>> checkReviewExists(
            @PathVariable Long bookingId) {
        try {
            boolean exists = reviewService.hasReviewedBooking(bookingId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Check completed", exists));
        } catch (Exception e) {
            log.error("Error checking review existence for booking {}", bookingId, e);
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage(), false));
        }
    }
    
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getDriverReviews(
            @PathVariable Long driverId) {
        try {
            List<ReviewResponse> reviews = reviewService.getDriverReviews(driverId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Reviews retrieved successfully", reviews));
        } catch (Exception e) {
            log.error("Error getting reviews for driver {}", driverId, e);
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
    
    @GetMapping("/driver/{driverId}/rating")
    public ResponseEntity<ApiResponse<DriverRatingResponse>> getDriverRating(
            @PathVariable Long driverId) {
        try {
            DriverRatingResponse rating = reviewService.getDriverRating(driverId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Rating retrieved successfully", rating));
        } catch (Exception e) {
            log.error("Error getting rating for driver {}", driverId, e);
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
    
    @GetMapping("/passenger/{passengerId}")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getPassengerReviews(
            @PathVariable Long passengerId) {
        try {
            List<ReviewResponse> reviews = reviewService.getPassengerReviews(passengerId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Reviews retrieved successfully", reviews));
        } catch (Exception e) {
            log.error("Error getting reviews for passenger {}", passengerId, e);
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
    
    @GetMapping("/ride/{rideId}")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getRideReviews(
            @PathVariable Long rideId) {
        try {
            List<ReviewResponse> reviews = reviewService.getRideReviews(rideId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Reviews retrieved successfully", reviews));
        } catch (Exception e) {
            log.error("Error getting reviews for ride {}", rideId, e);
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
