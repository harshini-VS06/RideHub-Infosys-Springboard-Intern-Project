package com.ridehub.controller;

import com.ridehub.dto.ApiResponse;
import com.ridehub.service.CancellationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/cancellations")
@RequiredArgsConstructor
public class CancellationController {
    
    private final CancellationService cancellationService;
    
    /**
     * Passenger cancels their booking
     */
    @PostMapping("/bookings/{bookingId}")
    @PreAuthorize("hasRole('PASSENGER')")
    public ResponseEntity<ApiResponse> cancelBooking(
            @PathVariable Long bookingId,
            @RequestBody Map<String, String> request) {
        try {
            String reason = request.getOrDefault("reason", "Passenger requested cancellation");
            
            cancellationService.cancelBookingByPassenger(bookingId, reason);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Booking cancelled successfully. Refund will be processed according to cancellation policy.")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
    
    /**
     * Driver cancels entire ride
     */
    @PostMapping("/rides/{rideId}")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse> cancelRide(
            @PathVariable Long rideId,
            @RequestBody Map<String, String> request) {
        try {
            String reason = request.getOrDefault("reason", "Driver cancelled ride");
            
            cancellationService.cancelRideByDriver(rideId, reason);
            
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Ride cancelled successfully. All passengers will receive full refund.")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
    
    /**
     * Get refund calculation preview (before actual cancellation)
     */
    @GetMapping("/bookings/{bookingId}/refund-preview")
    @PreAuthorize("hasRole('PASSENGER')")
    public ResponseEntity<ApiResponse> getRefundPreview(@PathVariable Long bookingId) {
        try {
            // This would require exposing a method in CancellationService
            // For now, return a generic message
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Refund calculation service")
                    .data(Map.of(
                            "info", "Cancellation within 48 hours may incur penalties",
                            "policy", Map.of(
                                    "before_48h", "100% refund",
                                    "24_48h", "90% refund (10% penalty)",
                                    "12_24h", "75% refund (25% penalty)",
                                    "1_12h", "50% refund (50% penalty)",
                                    "within_1h", "25% refund (75% penalty)",
                                    "after_start", "No refund"
                            )
                    ))
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }
}
