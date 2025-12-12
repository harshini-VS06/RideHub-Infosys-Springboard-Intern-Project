package com.ridehub.controller;

import com.razorpay.RazorpayException;
import com.ridehub.dto.PaymentOrderRequest;
import com.ridehub.dto.PaymentOrderResponse;
import com.ridehub.dto.PaymentVerificationRequest;
import com.ridehub.model.Payment;
import com.ridehub.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class PaymentController {
    
    private final PaymentService paymentService;
    
    @PostMapping("/create-order")
    public ResponseEntity<?> createPaymentOrder(@RequestBody PaymentOrderRequest request) {
        try {
            PaymentOrderResponse response = paymentService.createPaymentOrder(request.getBookingId());
            return ResponseEntity.ok(response);
        } catch (RazorpayException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create payment order: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody PaymentVerificationRequest request) {
        try {
            paymentService.verifyAndCompletePayment(request);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Payment verified and booking confirmed successfully");
            return ResponseEntity.ok(response);
        } catch (RazorpayException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Payment verification failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/my-payments")
    public ResponseEntity<List<Payment>> getMyPayments() {
        List<Payment> payments = paymentService.getPassengerPayments();
        return ResponseEntity.ok(payments);
    }
    
    @GetMapping("/driver-payments")
    public ResponseEntity<List<Payment>> getDriverPayments() {
        List<Payment> payments = paymentService.getDriverPayments();
        return ResponseEntity.ok(payments);
    }
}
