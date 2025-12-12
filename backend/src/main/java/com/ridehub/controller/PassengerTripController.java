package com.ridehub.controller;

import com.ridehub.dto.ApiResponse;
import com.ridehub.model.User;
import com.ridehub.repository.UserRepository;
import com.ridehub.service.TripManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/rides/bookings")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PassengerTripController {
    
    private final TripManagementService tripManagementService;
    private final UserRepository userRepository;
    
    /**
     * Passenger confirms they are ready to start the ride
     */
    @PostMapping("/{bookingId}/start-ride")
    @PreAuthorize("hasRole('PASSENGER')")
    public ResponseEntity<ApiResponse<Object>> passengerStartRide(
            @PathVariable Long bookingId,
            Authentication authentication) {
        try {
            // Get user email from authentication
            String email = authentication.getName();
            log.info("Start ride request from user: {}, booking: {}", email, bookingId);
            
            // Find user by email
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            Long passengerId = user.getId();
            log.info("Passenger {} starting ride for booking {}", passengerId, bookingId);
            
            tripManagementService.passengerStartRide(bookingId, passengerId);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Ride started successfully. Have a safe journey!")
                    .build());
        } catch (Exception e) {
            log.error("Error starting ride for booking {}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
    
    /**
     * Passenger confirms they have reached destination and wants to end the ride
     */
    @PostMapping("/{bookingId}/end-ride")
    @PreAuthorize("hasRole('PASSENGER')")
    public ResponseEntity<ApiResponse<Object>> passengerEndRide(
            @PathVariable Long bookingId,
            Authentication authentication) {
        try {
            // Get user email from authentication
            String email = authentication.getName();
            log.info("End ride request from user: {}, booking: {}", email, bookingId);
            
            // Find user by email
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            Long passengerId = user.getId();
            log.info("Passenger {} ending ride for booking {}", passengerId, bookingId);
            
            tripManagementService.passengerEndRide(bookingId, passengerId);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Ride completed successfully. Thank you for riding with us!")
                    .build());
        } catch (Exception e) {
            log.error("Error ending ride for booking {}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
}
