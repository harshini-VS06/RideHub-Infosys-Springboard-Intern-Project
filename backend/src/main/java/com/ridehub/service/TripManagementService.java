package com.ridehub.service;

import com.ridehub.model.*;
import com.ridehub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TripManagementService {
    
    private final RideRepository rideRepository;
    private final BookingRepository bookingRepository;
    private final PassengerBoardingRecordRepository boardingRecordRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final WalletService walletService;
    
    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 15;
    
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    /**
     * Driver starts the journey - sets trip status to PICKING_UP
     */
    @Transactional
    public void startJourney(Long rideId) {
        User driver = getCurrentUser();
        
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        
        if (!ride.getDriver().getId().equals(driver.getId())) {
            throw new RuntimeException("Unauthorized: You are not the driver of this ride");
        }
        
        if (ride.getTripStatus() != Ride.TripStatus.SCHEDULED) {
            throw new RuntimeException("Cannot start journey - Trip is not in SCHEDULED status");
        }
        
        // Update trip status
        ride.setTripStatus(Ride.TripStatus.PICKING_UP);
        ride.setTripStartedAt(LocalDateTime.now());
        rideRepository.save(ride);
        
        log.info("Driver {} started journey for ride {}", driver.getId(), rideId);
        
        // Send email to driver confirming journey started
        emailService.sendDriverJourneyStartedEmail(driver, ride);
        
        // Notify all confirmed passengers that driver has started
        List<Booking> confirmedBookings = bookingRepository.findActiveBookingsByRide(ride);
        for (Booking booking : confirmedBookings) {
            notificationService.sendTripStartedNotification(booking.getPassenger(), ride);
            emailService.sendTripStartedEmail(booking.getPassenger(), ride, booking);
        }
    }
    
    /**
     * Driver reaches a passenger's pickup location and requests OTP generation
     */
    @Transactional
    public String generateOnboardingOTP(Long bookingId) {
        User driver = getCurrentUser();
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        Ride ride = booking.getRide();
        
        if (!ride.getDriver().getId().equals(driver.getId())) {
            throw new RuntimeException("Unauthorized: You are not the driver of this ride");
        }
        
        if (ride.getTripStatus() != Ride.TripStatus.PICKING_UP && 
            ride.getTripStatus() != Ride.TripStatus.IN_PROGRESS) {
            throw new RuntimeException("Cannot onboard passenger - Trip not in PICKING_UP or IN_PROGRESS status");
        }
        
        if (booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            throw new RuntimeException("Cannot onboard - Booking not confirmed");
        }
        
        // Check if already onboarded
        if (boardingRecordRepository.existsByBookingAndOtpTypeAndIsValidatedTrue(
                booking, PassengerBoardingRecord.OTPType.ONBOARDING)) {
            throw new RuntimeException("Passenger already onboarded");
        }
        
        // Generate unique OTP
        String otpCode = generateOTP();
        
        // Create boarding record
        PassengerBoardingRecord record = PassengerBoardingRecord.builder()
                .booking(booking)
                .ride(ride)
                .passenger(booking.getPassenger())
                .otpCode(otpCode)
                .otpType(PassengerBoardingRecord.OTPType.ONBOARDING)
                .generatedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .isValidated(false)
                .build();
        
        boardingRecordRepository.save(record);
        
        // Send OTP email to passenger
        emailService.sendOnboardingOTPEmail(booking.getPassenger(), ride, booking, otpCode);
        
        log.info("Generated onboarding OTP for booking {}, passenger {}", bookingId, booking.getPassenger().getId());
        
        return otpCode;
    }
    
    /**
     * Validate onboarding OTP and mark passenger as onboarded
     */
    @Transactional
    public void validateOnboardingOTP(Long bookingId, String otpCode) {
        User driver = getCurrentUser();
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        Ride ride = booking.getRide();
        
        if (!ride.getDriver().getId().equals(driver.getId())) {
            throw new RuntimeException("Unauthorized: You are not the driver of this ride");
        }
        
        // Find the OTP record
        PassengerBoardingRecord record = boardingRecordRepository
                .findByOtpCodeAndOtpTypeAndIsValidatedFalse(
                        otpCode, PassengerBoardingRecord.OTPType.ONBOARDING)
                .orElseThrow(() -> new RuntimeException("Invalid OTP or OTP already used"));
        
        if (!record.getBooking().getId().equals(bookingId)) {
            throw new RuntimeException("OTP does not match this booking");
        }
        
        if (record.isExpired()) {
            throw new RuntimeException("OTP has expired");
        }
        
        // Mark as validated
        record.setIsValidated(true);
        record.setValidatedAt(LocalDateTime.now());
        boardingRecordRepository.save(record);
        
        // Update booking status
        booking.setStatus(Booking.BookingStatus.ONBOARDED);
        booking.setOnboardedAt(LocalDateTime.now());
        bookingRepository.save(booking);
        
        log.info("Passenger onboarded successfully - Booking: {}, Passenger: {}", 
                bookingId, booking.getPassenger().getId());
        
        // Send safe journey email with SOS option
        emailService.sendSafeJourneyEmail(booking.getPassenger(), ride, booking);
        
        // Notify passenger
        notificationService.sendOnboardedNotification(booking.getPassenger(), ride);
        
        // Check if all passengers are onboarded
        checkAndUpdateTripStatus(ride);
        
        // Send updated ETA to remaining passengers
        sendETAUpdatesToRemainingPassengers(ride);
    }
    
    /**
     * Generate deboarding OTP when driver reaches drop-off location
     */
    @Transactional
    public String generateDeboardingOTP(Long bookingId) {
        User driver = getCurrentUser();
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        Ride ride = booking.getRide();
        
        if (!ride.getDriver().getId().equals(driver.getId())) {
            throw new RuntimeException("Unauthorized: You are not the driver of this ride");
        }
        
        if (booking.getStatus() != Booking.BookingStatus.ONBOARDED) {
            throw new RuntimeException("Cannot deboard - Passenger not onboarded");
        }
        
        // Check if already deboarded
        if (boardingRecordRepository.existsByBookingAndOtpTypeAndIsValidatedTrue(
                booking, PassengerBoardingRecord.OTPType.DEBOARDING)) {
            throw new RuntimeException("Passenger already deboarded");
        }
        
        // Generate unique OTP
        String otpCode = generateOTP();
        
        // Create deboarding record
        PassengerBoardingRecord record = PassengerBoardingRecord.builder()
                .booking(booking)
                .ride(ride)
                .passenger(booking.getPassenger())
                .otpCode(otpCode)
                .otpType(PassengerBoardingRecord.OTPType.DEBOARDING)
                .generatedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .isValidated(false)
                .build();
        
        boardingRecordRepository.save(record);
        
        // Send OTP email to passenger
        emailService.sendDeboardingOTPEmail(booking.getPassenger(), ride, booking, otpCode);
        
        log.info("Generated deboarding OTP for booking {}, passenger {}", bookingId, booking.getPassenger().getId());
        
        return otpCode;
    }
    
    /**
     * Validate deboarding OTP and complete booking
     */
    @Transactional
    public void validateDeboardingOTP(Long bookingId, String otpCode) {
        User driver = getCurrentUser();
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        Ride ride = booking.getRide();
        
        if (!ride.getDriver().getId().equals(driver.getId())) {
            throw new RuntimeException("Unauthorized: You are not the driver of this ride");
        }
        
        // Find the OTP record
        PassengerBoardingRecord record = boardingRecordRepository
                .findByOtpCodeAndOtpTypeAndIsValidatedFalse(
                        otpCode, PassengerBoardingRecord.OTPType.DEBOARDING)
                .orElseThrow(() -> new RuntimeException("Invalid OTP or OTP already used"));
        
        if (!record.getBooking().getId().equals(bookingId)) {
            throw new RuntimeException("OTP does not match this booking");
        }
        
        if (record.isExpired()) {
            throw new RuntimeException("OTP has expired");
        }
        
        // Mark as validated
        record.setIsValidated(true);
        record.setValidatedAt(LocalDateTime.now());
        boardingRecordRepository.save(record);
        
        // Update booking status
        booking.setStatus(Booking.BookingStatus.DEBOARDED);
        booking.setDeboardedAt(LocalDateTime.now());
        bookingRepository.save(booking);
        
        log.info("Passenger deboarded successfully - Booking: {}, Passenger: {}", 
                bookingId, booking.getPassenger().getId());
        
        // Notify passenger
        notificationService.sendDeboardedNotification(booking.getPassenger(), ride);
        emailService.sendTripCompletedEmail(booking.getPassenger(), ride, booking);
        
        // Check if all passengers are deboarded - if yes, complete trip and unlock funds
        checkAndCompleteTripIfAllDeboarded(ride);
    }
    
    /**
     * Check if all passengers are onboarded and update trip status to IN_PROGRESS
     */
    private void checkAndUpdateTripStatus(Ride ride) {
        List<Booking> confirmedBookings = bookingRepository.findActiveBookingsByRide(ride);
        long onboardedCount = boardingRecordRepository.countByRideAndOtpTypeAndIsValidatedTrue(
                ride, PassengerBoardingRecord.OTPType.ONBOARDING);
        
        if (onboardedCount == confirmedBookings.size() && 
            ride.getTripStatus() == Ride.TripStatus.PICKING_UP) {
            ride.setTripStatus(Ride.TripStatus.IN_PROGRESS);
            rideRepository.save(ride);
            
            log.info("All passengers onboarded - Trip {} status updated to IN_PROGRESS", ride.getId());
            
            // Notify driver
            notificationService.sendAllPassengersOnboardedNotification(ride.getDriver(), ride);
        }
    }
    
    /**
     * Check if all passengers are deboarded and complete the trip
     */
    private void checkAndCompleteTripIfAllDeboarded(Ride ride) {
        List<Booking> onboardedBookings = bookingRepository.findActiveBookingsByRide(ride);
        long deboardedCount = boardingRecordRepository.countByRideAndOtpTypeAndIsValidatedTrue(
                ride, PassengerBoardingRecord.OTPType.DEBOARDING);
        
        if (deboardedCount == onboardedBookings.size()) {
            // Mark trip as completed
            ride.setTripStatus(Ride.TripStatus.COMPLETED);
            ride.setStatus(Ride.RideStatus.COMPLETED);
            ride.setTripCompletedAt(LocalDateTime.now());
            rideRepository.save(ride);
            
            // Mark all bookings as completed and unlock funds
            double totalUnlockedAmount = 0.0;
            for (Booking booking : onboardedBookings) {
                booking.setStatus(Booking.BookingStatus.COMPLETED);
                bookingRepository.save(booking);
                
                // Unlock funds for each booking
                walletService.unlockFunds(booking);
                totalUnlockedAmount += (booking.getFinalPrice() != null ? booking.getFinalPrice() : booking.getMaximumPrice());
                
                // Notify driver for each booking's funds unlocked
                notificationService.sendFundsUnlockedNotification(
                    ride.getDriver(), 
                    booking, 
                    booking.getFinalPrice() != null ? booking.getFinalPrice() : booking.getMaximumPrice()
                );
            }
            
            log.info("All passengers deboarded - Trip {} completed and funds unlocked. Total: ₹{}", 
                ride.getId(), totalUnlockedAmount);
            
            // Send completion email to driver with funds unlocked notification
            emailService.sendTripCompletedDriverEmail(ride.getDriver(), ride);
            emailService.sendFundsUnlockedEmail(ride.getDriver(), ride, totalUnlockedAmount);
        }
    }
    
    /**
     * Send ETA updates to passengers who haven't been picked up yet
     */
    private void sendETAUpdatesToRemainingPassengers(Ride ride) {
        List<Booking> confirmedBookings = bookingRepository.findActiveBookingsByRide(ride);
        
        for (Booking booking : confirmedBookings) {
            if (booking.getStatus() == Booking.BookingStatus.CONFIRMED) {
                // Calculate estimated time (simplified - in production use real-time location)
                emailService.sendETAUpdateEmail(booking.getPassenger(), ride, booking);
            }
        }
    }
    
    /**
     * Passenger confirms they are ready to start the ride
     * This automatically onboards the passenger (simplified flow without driver OTP)
     */
    @Transactional
    public void passengerStartRide(Long bookingId, Long passengerId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (!booking.getPassenger().getId().equals(passengerId)) {
            throw new RuntimeException("Unauthorized: This is not your booking");
        }
        
        if (booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            throw new RuntimeException("Cannot start ride - Booking must be in CONFIRMED status. Current status: " + booking.getStatus());
        }
        
        Ride ride = booking.getRide();
        
        // Check if ride time is within acceptable range (1 hour before to ride time)
        LocalDateTime rideDateTime = LocalDateTime.of(ride.getRideDate(), ride.getRideTime());
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneHourBefore = rideDateTime.minusHours(1);
        
        if (now.isBefore(oneHourBefore)) {
            throw new RuntimeException("Cannot start ride yet - You can start the ride 1 hour before scheduled time");
        }
        
        if (now.isAfter(rideDateTime.plusHours(2))) {
            throw new RuntimeException("Ride time has passed - Please contact support");
        }
        
        // Mark passenger as ready and onboard them automatically
        booking.setPassengerStartedRide(true);
        booking.setStatus(Booking.BookingStatus.ONBOARDED);  // Automatically onboard
        booking.setOnboardedAt(now);
        if (booking.getRideStartedAt() == null) {
            booking.setRideStartedAt(now);
        }
        bookingRepository.save(booking);
        
        log.info("Passenger {} started and onboarded for ride - Booking: {}", passengerId, bookingId);
    }
    
    /**
     * Passenger confirms they have completed the ride and reached destination
     * This marks the booking as DEBOARDED from passenger's side
     */
    @Transactional
    public void passengerEndRide(Long bookingId, Long passengerId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (!booking.getPassenger().getId().equals(passengerId)) {
            throw new RuntimeException("Unauthorized: This is not your booking");
        }
        
        // Can only end ride if currently onboarded (driver has picked them up)
        if (booking.getStatus() != Booking.BookingStatus.ONBOARDED) {
            throw new RuntimeException("Cannot end ride - You must be onboarded first. Current status: " + booking.getStatus());
        }
        
        Ride ride = booking.getRide();
        
        // Mark booking as deboarded (completed from passenger's perspective)
        booking.setStatus(Booking.BookingStatus.DEBOARDED);
        booking.setDeboardedAt(LocalDateTime.now());
        booking.setRideEndedAt(LocalDateTime.now());
        bookingRepository.save(booking);
        
        log.info("Passenger {} ended ride successfully - Booking: {}", passengerId, bookingId);
        
        // Notify driver that passenger has completed their journey
        // Note: Notification methods can be added later if needed
        log.info("Passenger {} completed ride for booking {}", passengerId, bookingId);
        
        // Check if all passengers are deboarded and complete trip
        checkAndCompleteTripIfAllDeboarded(ride);
    }
    
    /**
     * Generate random 6-digit OTP
     */
    private String generateOTP() {
        SecureRandom random = new SecureRandom();
        StringBuilder otp = new StringBuilder();
        
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        
        return otp.toString();
    }
}
