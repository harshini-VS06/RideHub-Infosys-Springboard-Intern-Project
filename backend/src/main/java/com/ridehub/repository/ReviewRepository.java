package com.ridehub.repository;

import com.ridehub.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    // Find review by booking ID
    Optional<Review> findByBookingId(Long bookingId);
    
    // Check if review exists for a booking
    boolean existsByBookingId(Long bookingId);
    
    // Get all reviews for a driver
    List<Review> findByDriverIdOrderByCreatedAtDesc(Long driverId);
    
    // Get all reviews by a passenger
    List<Review> findByPassengerIdOrderByCreatedAtDesc(Long passengerId);
    
    // Get all reviews for a ride
    List<Review> findByRideIdOrderByCreatedAtDesc(Long rideId);
    
    // Calculate average rating for a driver
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.driver.id = :driverId")
    Double getAverageRatingForDriver(@Param("driverId") Long driverId);
    
    // Count total reviews for a driver
    @Query("SELECT COUNT(r) FROM Review r WHERE r.driver.id = :driverId")
    Long countReviewsForDriver(@Param("driverId") Long driverId);
    
    // Get driver rating statistics
    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.driver.id = :driverId GROUP BY r.rating ORDER BY r.rating DESC")
    List<Object[]> getRatingDistributionForDriver(@Param("driverId") Long driverId);
    
    // Admin queries - Review uses 'passenger' and 'driver', not 'reviewer' and 'reviewee'
    @Modifying
    @Query("DELETE FROM Review r WHERE r.passenger.id = :passengerId")
    void deleteByPassengerId(@Param("passengerId") Long passengerId);
    
    @Modifying
    @Query("DELETE FROM Review r WHERE r.driver.id = :driverId")
    void deleteByDriverId(@Param("driverId") Long driverId);
}
