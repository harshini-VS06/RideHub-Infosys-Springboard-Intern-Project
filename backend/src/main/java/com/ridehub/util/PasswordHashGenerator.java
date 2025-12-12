package com.ridehub.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utility to generate BCrypt password hash
 * Run this class to generate the correct hash for your password
 */
public class PasswordHashGenerator {
    
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // Generate hash for different passwords
        String[] passwords = {
            "Admin@RideHub2024",
            "admin123",
            "RideHub@2024"
        };
        
        System.out.println("========================================");
        System.out.println("BCrypt Password Hash Generator");
        System.out.println("========================================");
        System.out.println();
        
        for (String password : passwords) {
            String hash = encoder.encode(password);
            
            System.out.println("Password: " + password);
            System.out.println("Hash: " + hash);
            System.out.println();
            System.out.println("SQL Update Statement:");
            System.out.println("UPDATE users SET password = '" + hash + "' WHERE email = 'admin@ridehub.com';");
            System.out.println();
            
            // Verify the hash works
            boolean matches = encoder.matches(password, hash);
            System.out.println("Verification: " + (matches ? "✓ PASS" : "✗ FAIL"));
            System.out.println("========================================");
            System.out.println();
        }
    }
}
