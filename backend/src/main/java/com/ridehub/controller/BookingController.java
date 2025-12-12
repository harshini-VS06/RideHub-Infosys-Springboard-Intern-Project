package com.ridehub.controller;

import com.ridehub.dto.BookingRequest;
import com.ridehub.dto.BookingResponse;
import com.ridehub.service.BookingService;
import com.ridehub.service.BookingSchedulerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class BookingController {
    
    private final BookingService bookingService;
    private final BookingSchedulerService schedulerService;
    
    @PostMapping
    public ResponseEntity<?> createBooking(@Valid @RequestBody BookingRequest request) {
        try {
            log.info("[BookingController] Creating booking with request: {}", request);
            BookingResponse response = bookingService.createBooking(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("[BookingController] Error creating booking: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "error", e.getMessage(),
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        }
    }
    
    @GetMapping("/my-bookings")
    public ResponseEntity<?> getMyBookings() {
        try {
            log.info("[BookingController] GET /my-bookings endpoint called");
            List<BookingResponse> bookings = bookingService.getMyBookings();
            log.info("[BookingController] Successfully fetched {} bookings", bookings.size());
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            log.error("[BookingController] Error fetching bookings: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "error", e.getMessage(),
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        }
    }
    
    @GetMapping("/ride/{rideId}")
    public ResponseEntity<List<BookingResponse>> getRideBookings(@PathVariable Long rideId) {
        try {
            List<BookingResponse> bookings = bookingService.getRideBookings(rideId);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            log.error("Error fetching ride bookings: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable Long id) {
        try {
            BookingResponse booking = bookingService.getBookingById(id);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            log.error("Error fetching booking by id: {}", e.getMessage(), e);
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelBooking(@PathVariable Long id) {
        try {
            bookingService.cancelBooking(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error canceling booking: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/admin/trigger-payment-processing")
    public ResponseEntity<?> triggerPaymentProcessing() {
        try {
            log.info("[BookingController] Manual trigger for payment processing");
            schedulerService.processPaymentRequests();
            return ResponseEntity.ok(java.util.Map.of(
                "message", "Payment processing triggered successfully",
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        } catch (Exception e) {
            log.error("Error triggering payment processing: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "error", e.getMessage(),
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        }
    }
}
