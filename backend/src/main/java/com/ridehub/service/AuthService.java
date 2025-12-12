package com.ridehub.service;

import com.ridehub.dto.*;
import com.ridehub.model.OTP;
import com.ridehub.model.User;
import com.ridehub.repository.UserRepository;
import com.ridehub.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final OTPService otpService;
    
    @Transactional
    public OTPResponse initiateRegistration(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        
        // Check if contact already exists
        if (userRepository.existsByContact(request.getContact())) {
            throw new RuntimeException("Contact number already registered");
        }
        
        // Generate and send OTP
        otpService.generateAndSendOTP(request.getEmail(), OTP.OTPPurpose.REGISTRATION);
        
        return new OTPResponse("OTP sent successfully to " + request.getEmail(), request.getEmail(), true);
    }
    
    @Transactional
    public AuthResponse completeRegistration(RegisterRequest request, String otp) {
        // Verify OTP
        boolean isOtpValid = otpService.verifyOTP(request.getEmail(), otp);
        
        if (!isOtpValid) {
            throw new RuntimeException("Invalid or expired OTP");
        }
        
        // Create new user
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .contact(request.getContact())
                .age(request.getAge())
                .role(User.Role.valueOf(request.getRole()))
                .gender(request.getGender())
                .carModel(request.getCarModel())
                .licensePlate(request.getLicensePlate())
                .capacity(request.getCapacity())
                .active(true)
                .build();
        
        user = userRepository.save(user);
        
        // Generate JWT token
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);
        
        // Build response
        UserResponse userResponse = mapToUserResponse(user);
        
        return new AuthResponse(token, userResponse);
    }
    
    @Transactional
    public AuthResponse loginWithPassword(LoginRequest request) {
        // Check if user exists
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));
        
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }
        
        if (!user.getActive()) {
            throw new RuntimeException("Account is deactivated");
        }
        
        // Authenticate using Spring Security
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        
        // Generate JWT token
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);
        
        // Build response
        UserResponse userResponse = mapToUserResponse(user);
        
        return new AuthResponse(token, userResponse);
    }
    
    @Transactional
    public OTPResponse initiateLogin(LoginRequest request) {
        // Check if user exists
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));
        
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }
        
        if (!user.getActive()) {
            throw new RuntimeException("Account is deactivated");
        }
        
        // Generate and send OTP
        otpService.generateAndSendOTP(request.getEmail(), OTP.OTPPurpose.LOGIN);
        
        return new OTPResponse("OTP sent successfully to " + request.getEmail(), request.getEmail(), true);
    }
    
    public AuthResponse completeLogin(String email, String otp) {
        // Verify OTP
        boolean isOtpValid = otpService.verifyOTP(email, otp);
        
        if (!isOtpValid) {
            throw new RuntimeException("Invalid or expired OTP");
        }
        
        // Get user details
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Generate JWT token
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);
        
        // Build response
        UserResponse userResponse = mapToUserResponse(user);
        
        return new AuthResponse(token, userResponse);
    }
    
    public OTPResponse resendOTP(String email, String purpose) {
        OTP.OTPPurpose otpPurpose = OTP.OTPPurpose.valueOf(purpose.toUpperCase());
        otpService.resendOTP(email, otpPurpose);
        
        return new OTPResponse("OTP resent successfully to " + email, email, true);
    }
    
    @Transactional
    public OTPResponse initiateForgotPassword(String email) {
        // Check if user exists
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email"));
        
        if (!user.getActive()) {
            throw new RuntimeException("Account is deactivated");
        }
        
        // Generate and send OTP
        otpService.generateAndSendOTP(email, OTP.OTPPurpose.PASSWORD_RESET);
        
        return new OTPResponse("Password reset OTP sent successfully to " + email, email, true);
    }
    
    public OTPResponse verifyForgotPasswordOTP(String email, String otp) {
        // Verify OTP
        boolean isOtpValid = otpService.verifyOTP(email, otp);
        
        if (!isOtpValid) {
            throw new RuntimeException("Invalid or expired OTP");
        }
        
        return new OTPResponse("OTP verified successfully. You can now reset your password.", email, true);
    }
    
    @Transactional
    public OTPResponse resetPassword(ResetPasswordRequest request) {
        // Verify OTP again for security
        boolean isOtpValid = otpService.verifyOTP(request.getEmail(), request.getOtp());
        
        if (!isOtpValid) {
            throw new RuntimeException("Invalid or expired OTP");
        }
        
        // Get user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        // Invalidate the OTP after successful password reset
        otpService.invalidateOTP(request.getEmail());
        
        return new OTPResponse("Password reset successfully. You can now login with your new password.", request.getEmail(), true);
    }
    
    @Transactional
    public OTPResponse initiateOTPLogin(String email) {
        // Check if user exists
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email"));
        
        if (!user.getActive()) {
            throw new RuntimeException("Account is deactivated");
        }
        
        // Generate and send OTP
        otpService.generateAndSendOTP(email, OTP.OTPPurpose.LOGIN);
        
        return new OTPResponse("Login OTP sent successfully to " + email, email, true);
    }
    
    public AuthResponse verifyOTPLogin(String email, String otp) {
        // Verify OTP
        boolean isOtpValid = otpService.verifyOTP(email, otp);
        
        if (!isOtpValid) {
            throw new RuntimeException("Invalid or expired OTP");
        }
        
        // Get user details
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Generate JWT token
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);
        
        // Build response
        UserResponse userResponse = mapToUserResponse(user);
        
        return new AuthResponse(token, userResponse);
    }
    
    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .contact(user.getContact())
                .age(user.getAge())
                .role(user.getRole().name())
                .gender(user.getGender())
                .carModel(user.getCarModel())
                .licensePlate(user.getLicensePlate())
                .capacity(user.getCapacity())
                .build();
    }
}
