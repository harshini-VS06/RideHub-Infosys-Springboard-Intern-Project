package com.ridehub.controller;

import com.ridehub.dto.ApiResponse;
import com.ridehub.service.TripManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {
    
    private final TripManagementService tripManagementService;
    
    /**
     * Driver starts the journey
     */
    @PostMapping("/{rideId}/start")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse> startJourney(@PathVariable Long rideId) {
        try {
            tripManagementService.startJourney(rideId);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Journey started successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
    
    /**
     * Driver generates onboarding OTP for a passenger
     */
    @PostMapping("/bookings/{bookingId}/onboard-otp")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse> generateOnboardingOTP(@PathVariable Long bookingId) {
        try {
            String otp = tripManagementService.generateOnboardingOTP(bookingId);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Onboarding OTP generated and sent to passenger")
                    .data(java.util.Map.of("otp", otp))
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
    
    /**
     * Driver validates onboarding OTP
     */
    @PostMapping("/bookings/{bookingId}/validate-onboard")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse> validateOnboardingOTP(
            @PathVariable Long bookingId,
            @RequestBody java.util.Map<String, String> request) {
        try {
            String otpCode = request.get("otpCode");
            if (otpCode == null || otpCode.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.builder()
                        .success(false)
                        .message("OTP code is required")
                        .build());
            }
            
            tripManagementService.validateOnboardingOTP(bookingId, otpCode);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Passenger onboarded successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
    
    /**
     * Driver generates deboarding OTP for a passenger
     */
    @PostMapping("/bookings/{bookingId}/deboard-otp")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse> generateDeboardingOTP(@PathVariable Long bookingId) {
        try {
            String otp = tripManagementService.generateDeboardingOTP(bookingId);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Deboarding OTP generated and sent to passenger")
                    .data(java.util.Map.of("otp", otp))
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
    
    /**
     * Driver validates deboarding OTP
     */
    @PostMapping("/bookings/{bookingId}/validate-deboard")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse> validateDeboardingOTP(
            @PathVariable Long bookingId,
            @RequestBody java.util.Map<String, String> request) {
        try {
            String otpCode = request.get("otpCode");
            if (otpCode == null || otpCode.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.builder()
                        .success(false)
                        .message("OTP code is required")
                        .build());
            }
            
            tripManagementService.validateDeboardingOTP(bookingId, otpCode);
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Passenger deboarded successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
}
