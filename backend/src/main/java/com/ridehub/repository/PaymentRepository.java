package com.ridehub.repository;

import com.ridehub.model.Payment;
import com.ridehub.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);
    Optional<Payment> findByBooking(Booking booking);
    
    @Query("SELECT p FROM Payment p " +
           "LEFT JOIN FETCH p.booking b " +
           "LEFT JOIN FETCH b.ride r " +
           "WHERE p.passenger.id = :passengerId " +
           "ORDER BY p.createdAt DESC")
    List<Payment> findByPassengerId(@Param("passengerId") Long passengerId);
    
    @Query("SELECT p FROM Payment p " +
           "LEFT JOIN FETCH p.booking b " +
           "LEFT JOIN FETCH b.ride r " +
           "WHERE p.driver.id = :driverId " +
           "ORDER BY p.createdAt DESC")
    List<Payment> findByDriverId(@Param("driverId") Long driverId);
}
