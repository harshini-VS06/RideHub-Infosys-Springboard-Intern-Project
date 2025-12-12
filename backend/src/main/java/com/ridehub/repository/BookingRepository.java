package com.ridehub.repository;

import com.ridehub.model.Booking;
import com.ridehub.model.Ride;
import com.ridehub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    List<Booking> findByPassenger(User passenger);
    
    @Query("SELECT b FROM Booking b JOIN FETCH b.ride r JOIN FETCH r.driver WHERE b.passenger = :passenger ORDER BY b.bookedAt DESC")
    List<Booking> findByPassengerOrderByBookedAtDesc(@Param("passenger") User passenger);
    
    List<Booking> findByRide(Ride ride);
    
    @Query("SELECT b FROM Booking b JOIN FETCH b.passenger WHERE b.ride = :ride ORDER BY b.bookedAt DESC")
    List<Booking> findByRideOrderByBookedAtDesc(@Param("ride") Ride ride);
    
    List<Booking> findByStatus(Booking.BookingStatus status);
    
    @Query("SELECT b FROM Booking b WHERE b.ride = :ride AND b.status IN ('TENTATIVE', 'PAYMENT_PENDING', 'CONFIRMED')")
    List<Booking> findActiveBookingsByRide(@Param("ride") Ride ride);
    
    @Query("SELECT b FROM Booking b WHERE b.ride.id = :rideId AND b.status = 'CONFIRMED'")
    List<Booking> findConfirmedBookingsByRideId(@Param("rideId") Long rideId);
    
    @Query("SELECT b FROM Booking b WHERE b.paymentDueAt <= :now AND b.status = 'TENTATIVE' AND b.paymentRequestSent = false")
    List<Booking> findBookingsNeedingPaymentRequest(@Param("now") LocalDateTime now);
    
    /**
     * Find all COMPLETED or DEBOARDED bookings that might have locked funds
     * Used by scheduler to automatically release locked funds
     */
    @Query("SELECT b FROM Booking b " +
           "WHERE (b.status = 'COMPLETED' OR b.status = 'DEBOARDED') " +
           "AND b.rideEndedAt IS NOT NULL " +
           "ORDER BY b.rideEndedAt ASC")
    List<Booking> findCompletedBookingsWithLockedFunds();
    
    // Admin queries
    Long countByStatus(Booking.BookingStatus status);
    
    Long countByPassengerId(Long passengerId);
    
    Long countByPassengerIdAndStatus(Long passengerId, Booking.BookingStatus status);
    
    @Modifying
    @Query("DELETE FROM Booking b WHERE b.passenger.id = :passengerId")
    void deleteByPassengerId(@Param("passengerId") Long passengerId);
    
    @Modifying
    @Query("DELETE FROM Booking b WHERE b.ride.id = :rideId")
    void deleteByRideId(@Param("rideId") Long rideId);
}
