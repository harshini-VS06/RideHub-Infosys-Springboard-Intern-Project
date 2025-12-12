package com.ridehub.controller;

import com.ridehub.dto.CreateRideRequest;
import com.ridehub.dto.RideResponse;
import com.ridehub.service.RideService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rides")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class RideController {
    
    private final RideService rideService;
    
    @PostMapping
    public ResponseEntity<RideResponse> createRide(@Valid @RequestBody CreateRideRequest request) {
        try {
            RideResponse response = rideService.createRide(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating ride: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/my-rides")
    public ResponseEntity<List<RideResponse>> getMyRides() {
        try {
            List<RideResponse> rides = rideService.getMyRides();
            return ResponseEntity.ok(rides);
        } catch (Exception e) {
            log.error("Error fetching my rides: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<RideResponse>> searchRides(
            @RequestParam String source,
            @RequestParam String destination,
            @RequestParam String date) {
        try {
            log.info("Searching rides: source={}, destination={}, date={}", source, destination, date);
            List<RideResponse> rides = rideService.searchRides(source, destination, date);
            log.info("Found {} rides", rides.size());
            return ResponseEntity.ok(rides);
        } catch (Exception e) {
            log.error("Error searching rides: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/search/smart-match")
    public ResponseEntity<List<RideResponse>> searchRidesWithMatching(
            @RequestParam String source,
            @RequestParam String destination,
            @RequestParam String date,
            @RequestParam Double pickupLat,
            @RequestParam Double pickupLng,
            @RequestParam Double dropLat,
            @RequestParam Double dropLng) {
        try {
            log.info("Smart search: source={}, destination={}, date={}", source, destination, date);
            List<RideResponse> rides = rideService.searchRidesWithRouteMatching(
                source, destination, date, pickupLat, pickupLng, dropLat, dropLng);
            log.info("Found {} matching rides", rides.size());
            return ResponseEntity.ok(rides);
        } catch (Exception e) {
            log.error("Error in smart search: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/available")
    public ResponseEntity<List<RideResponse>> getAvailableRides() {
        try {
            List<RideResponse> rides = rideService.getAvailableRides();
            log.info("Found {} available rides", rides.size());
            return ResponseEntity.ok(rides);
        } catch (Exception e) {
            log.error("Error fetching available rides: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/available/gender/{gender}")
    public ResponseEntity<List<RideResponse>> getAvailableRidesByGender(@PathVariable String gender) {
        try {
            List<RideResponse> rides = rideService.getAvailableRidesByGender(gender);
            log.info("Found {} rides for gender: {}", rides.size(), gender);
            return ResponseEntity.ok(rides);
        } catch (Exception e) {
            log.error("Error fetching rides by gender: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<RideResponse> getRideById(@PathVariable Long id) {
        try {
            RideResponse ride = rideService.getRideById(id);
            return ResponseEntity.ok(ride);
        } catch (Exception e) {
            log.error("Error fetching ride by id: {}", e.getMessage(), e);
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelRide(@PathVariable Long id) {
        try {
            rideService.cancelRide(id);
            return ResponseEntity.ok(java.util.Map.of(
                "message", "Ride cancelled successfully",
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        } catch (Exception e) {
            log.error("Error canceling ride: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "error", e.getMessage(),
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        }
    }
    
    @PostMapping("/booking/{bookingId}/start")
    public ResponseEntity<?> startRide(@PathVariable Long bookingId) {
        try {
            rideService.startRide(bookingId);
            return ResponseEntity.ok(java.util.Map.of(
                "message", "Ride started successfully",
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        } catch (Exception e) {
            log.error("Error starting ride: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "error", e.getMessage(),
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        }
    }
    
    @PostMapping("/booking/{bookingId}/end")
    public ResponseEntity<?> endRide(@PathVariable Long bookingId) {
        try {
            rideService.endRide(bookingId);
            return ResponseEntity.ok(java.util.Map.of(
                "message", "Ride ended successfully",
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        } catch (Exception e) {
            log.error("Error ending ride: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "error", e.getMessage(),
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        }
    }
}
