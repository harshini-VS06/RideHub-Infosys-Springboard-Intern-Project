package com.ridehub.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {
    
    @NotBlank(message = "Name is required")
    private String name;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&+=!]).*$", 
             message = "Password must contain at least one uppercase letter, one number, and one special character")
    private String password;
    
    @NotBlank(message = "Contact is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Contact must be 10 digits")
    private String contact;
    
    @NotBlank(message = "Age is required")
    private String age;
    
    @NotBlank(message = "Role is required")
    @Pattern(regexp = "DRIVER|PASSENGER", message = "Role must be DRIVER or PASSENGER")
    private String role;
    
    private String gender;
    
    // Driver-specific fields
    private String carModel;
    private String licensePlate;
    private String capacity;
}
