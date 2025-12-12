package com.ridehub.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    @JsonIgnoreProperties({"payment", "passenger", "ride", "driver", "hibernateLazyInitializer", "handler"})
    private Booking booking;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "passenger_id", nullable = false)
    @JsonIgnoreProperties({"password", "bookings", "rides", "payments", "hibernateLazyInitializer", "handler"})
    private User passenger;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    @JsonIgnoreProperties({"password", "bookings", "rides", "payments", "hibernateLazyInitializer", "handler"})
    private User driver;
    
    @Column(nullable = false, unique = true)
    private String razorpayOrderId;
    
    @Column(unique = true)
    private String razorpayPaymentId;
    
    private String razorpaySignature;
    
    @Column(nullable = false)
    private Double amount;
    
    @Column(nullable = false)
    private Double finalSeatRate;
    
    @Column(nullable = false)
    private Integer totalBookedSeats;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;
    
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime paidAt;
    
    @Column(length = 1000)
    private String failureReason;
    
    public enum PaymentStatus {
        PENDING, COMPLETED, FAILED, REFUNDED
    }
}
