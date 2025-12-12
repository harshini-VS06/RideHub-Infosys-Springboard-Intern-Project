package com.ridehub.controller;

import com.ridehub.dto.*;
import com.ridehub.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/register/initiate")
    public ResponseEntity<OTPResponse> initiateRegistration(@Valid @RequestBody RegisterRequest request) {
        try {
            OTPResponse response = authService.initiateRegistration(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new OTPResponse(e.getMessage(), request.getEmail(), false));
        }
    }
    
    @PostMapping("/register/verify")
    public ResponseEntity<?> completeRegistration(
            @Valid @RequestBody RegisterRequest request,
            @RequestParam String otp) {
        try {
            AuthResponse response = authService.completeRegistration(request, otp);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new OTPResponse(e.getMessage(), request.getEmail(), false));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.loginWithPassword(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new OTPResponse(e.getMessage(), request.getEmail(), false));
        }
    }
    
    @PostMapping("/login/initiate")
    public ResponseEntity<OTPResponse> initiateLogin(@Valid @RequestBody LoginRequest request) {
        try {
            OTPResponse response = authService.initiateLogin(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new OTPResponse(e.getMessage(), request.getEmail(), false));
        }
    }
    
    @PostMapping("/login/verify")
    public ResponseEntity<?> completeLogin(@Valid @RequestBody VerifyOTPRequest request) {
        try {
            AuthResponse response = authService.completeLogin(request.getEmail(), request.getOtp());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new OTPResponse(e.getMessage(), request.getEmail(), false));
        }
    }
    
    @PostMapping("/otp/resend")
    public ResponseEntity<OTPResponse> resendOTP(@Valid @RequestBody OTPRequest request, @RequestParam String purpose) {
        try {
            OTPResponse response = authService.resendOTP(request.getEmail(), purpose);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new OTPResponse(e.getMessage(), request.getEmail(), false));
        }
    }
    
    @PostMapping("/forgot-password/initiate")
    public ResponseEntity<OTPResponse> initiateForgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            OTPResponse response = authService.initiateForgotPassword(request.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new OTPResponse(e.getMessage(), request.getEmail(), false));
        }
    }
    
    @PostMapping("/forgot-password/verify")
    public ResponseEntity<OTPResponse> verifyForgotPasswordOTP(@Valid @RequestBody VerifyOTPRequest request) {
        try {
            OTPResponse response = authService.verifyForgotPasswordOTP(request.getEmail(), request.getOtp());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new OTPResponse(e.getMessage(), request.getEmail(), false));
        }
    }
    
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<OTPResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            OTPResponse response = authService.resetPassword(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new OTPResponse(e.getMessage(), request.getEmail(), false));
        }
    }
    
    @PostMapping("/login-otp/initiate")
    public ResponseEntity<OTPResponse> initiateOTPLogin(@Valid @RequestBody OTPRequest request) {
        try {
            OTPResponse response = authService.initiateOTPLogin(request.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new OTPResponse(e.getMessage(), request.getEmail(), false));
        }
    }
    
    @PostMapping("/login-otp/verify")
    public ResponseEntity<?> verifyOTPLogin(@Valid @RequestBody VerifyOTPRequest request) {
        try {
            AuthResponse response = authService.verifyOTPLogin(request.getEmail(), request.getOtp());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new OTPResponse(e.getMessage(), request.getEmail(), false));
        }
    }
}
