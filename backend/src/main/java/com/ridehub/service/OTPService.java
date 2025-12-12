package com.ridehub.service;

import com.ridehub.model.OTP;
import com.ridehub.repository.OTPRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OTPService {
    
    private final OTPRepository otpRepository;
    private final EmailService emailService;
    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 10;
    
    @Transactional
    public String generateAndSendOTP(String email, OTP.OTPPurpose purpose) {
        // Generate 6-digit OTP
        String otpCode = generateOTP();
        
        // Create OTP entity
        OTP otp = OTP.builder()
                .email(email)
                .otpCode(otpCode)
                .purpose(purpose)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .verified(false)
                .build();
        
        otpRepository.save(otp);
        
        // Send OTP via email
        emailService.sendOTPEmail(email, otpCode);
        
        return otpCode;
    }
    
    @Transactional
    public boolean verifyOTP(String email, String otpCode) {
        OTP otp = otpRepository.findByEmailAndOtpCodeAndVerifiedFalse(email, otpCode)
                .orElseThrow(() -> new RuntimeException("Invalid OTP"));
        
        if (otp.isExpired()) {
            throw new RuntimeException("OTP has expired");
        }
        
        otp.setVerified(true);
        otpRepository.save(otp);
        
        return true;
    }
    
    @Transactional
    public void resendOTP(String email, OTP.OTPPurpose purpose) {
        // Get the latest unverified OTP for this email
        OTP existingOTP = otpRepository.findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(email)
                .orElse(null);
        
        if (existingOTP != null && !existingOTP.isExpired()) {
            // Resend the same OTP if it's still valid
            emailService.sendOTPEmail(email, existingOTP.getOtpCode());
        } else {
            // Generate and send a new OTP
            generateAndSendOTP(email, purpose);
        }
    }
    
    private String generateOTP() {
        SecureRandom random = new SecureRandom();
        StringBuilder otp = new StringBuilder();
        
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        
        return otp.toString();
    }
    
    @Transactional
    public void cleanupExpiredOTPs() {
        otpRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }
    
    @Transactional
    public void invalidateOTP(String email) {
        // Mark all OTPs for this email as verified/used
        otpRepository.findAllByEmailAndVerifiedFalse(email)
                .forEach(otp -> {
                    otp.setVerified(true);
                    otpRepository.save(otp);
                });
    }
}
