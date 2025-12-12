package com.ridehub.repository;

import com.ridehub.model.Ride;
import com.ridehub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RideRepository extends JpaRepository<Ride, Long> {
    
    List<Ride> findByDriver(User driver);
    
    @Query("SELECT r FROM Ride r JOIN FETCH r.driver WHERE r.driver = :driver ORDER BY r.rideDate DESC")
    List<Ride> findByDriverOrderByRideDateDesc(@Param("driver") User driver);
    
    @Query("SELECT r FROM Ride r JOIN FETCH r.driver WHERE " +
           "(LOWER(r.source) LIKE LOWER(CONCAT('%', :source, '%')) OR LOWER(:source) LIKE LOWER(CONCAT('%', r.source, '%'))) AND " +
           "(LOWER(r.destination) LIKE LOWER(CONCAT('%', :destination, '%')) OR LOWER(:destination) LIKE LOWER(CONCAT('%', r.destination, '%'))) AND " +
           "r.rideDate = :date AND r.status = 'AVAILABLE' AND r.availableSeats > 0")
    List<Ride> findAvailableRides(@Param("source") String source, 
                                   @Param("destination") String destination, 
                                   @Param("date") LocalDate date);
    
    @Query("SELECT r FROM Ride r JOIN FETCH r.driver WHERE r.status = 'AVAILABLE' AND r.availableSeats > 0 " +
           "AND r.rideDate >= :currentDate ORDER BY r.rideDate ASC")
    List<Ride> findAllAvailableRides(@Param("currentDate") LocalDate currentDate);
    
    @Query("SELECT r FROM Ride r JOIN FETCH r.driver WHERE r.driver.gender = :gender AND r.status = 'AVAILABLE' " +
           "AND r.availableSeats > 0 AND r.rideDate >= :currentDate")
    List<Ride> findAvailableRidesByDriverGender(@Param("gender") String gender, 
                                                  @Param("currentDate") LocalDate currentDate);
    
    // Admin queries
    List<Ride> findByDriverId(Long driverId);
    
    Long countByDriverId(Long driverId);
    
    Long countByStatus(Ride.RideStatus status);
    
    Long countByDriverIdAndStatus(Long driverId, Ride.RideStatus status);
    
    void deleteByDriverId(Long driverId);
}
