package com.ridehub.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "passenger_boarding_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PassengerBoardingRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ride_id", nullable = false)
    private Ride ride;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "passenger_id", nullable = false)
    private User passenger;
    
    @Column(nullable = false, length = 6)
    private String otpCode;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OTPType otpType;
    
    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private LocalDateTime generatedAt;
    
    private LocalDateTime validatedAt;
    
    @Column(nullable = false)
    private Boolean isValidated = false;
    
    @Column(nullable = false)
    private LocalDateTime expiresAt;
    
    public enum OTPType {
        ONBOARDING, DEBOARDING
    }
    
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
