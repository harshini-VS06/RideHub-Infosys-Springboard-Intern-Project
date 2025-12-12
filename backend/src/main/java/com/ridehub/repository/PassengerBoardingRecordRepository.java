package com.ridehub.repository;

import com.ridehub.model.PassengerBoardingRecord;
import com.ridehub.model.Booking;
import com.ridehub.model.Ride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PassengerBoardingRecordRepository extends JpaRepository<PassengerBoardingRecord, Long> {
    
    List<PassengerBoardingRecord> findByRideOrderByGeneratedAtAsc(Ride ride);
    
    List<PassengerBoardingRecord> findByBooking(Booking booking);
    
    Optional<PassengerBoardingRecord> findByBookingAndOtpTypeAndIsValidatedFalse(
        Booking booking, 
        PassengerBoardingRecord.OTPType otpType
    );
    
    Optional<PassengerBoardingRecord> findByOtpCodeAndOtpTypeAndIsValidatedFalse(
        String otpCode, 
        PassengerBoardingRecord.OTPType otpType
    );
    
    Long countByRideAndOtpTypeAndIsValidatedTrue(Ride ride, PassengerBoardingRecord.OTPType otpType);
    
    Boolean existsByBookingAndOtpTypeAndIsValidatedTrue(
        Booking booking, 
        PassengerBoardingRecord.OTPType otpType
    );
}
