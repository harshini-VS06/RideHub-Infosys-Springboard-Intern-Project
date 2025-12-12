package com.ridehub.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class Booking {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ride_id", nullable = false)
    @JsonIgnoreProperties({"bookings", "driver", "hibernateLazyInitializer", "handler"})
    private Ride ride;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "passenger_id", nullable = false)
    @JsonIgnoreProperties({"password", "bookings", "rides", "payments", "hibernateLazyInitializer", "handler"})
    private User passenger;
    
    @Column(nullable = false)
    private Integer seatsBooked;
    
    @Column(nullable = false)
    private String pickupLocation;
    
    @Column(nullable = false)
    private String dropLocation;
    
    private Double segmentDistance;
    
    private Double pickupLat;
    
    private Double pickupLng;
    
    private Double dropLat;
    
    private Double dropLng;
    
    @Column(nullable = false)
    private Double maximumPrice;
    
    // Legacy column mapping - maps to the same value as maximumPrice
    // This exists because the database has a NOT NULL constraint on total_fare
    @Column(name = "total_fare", nullable = false)
    private Double totalFare;
    
    private Double finalPrice;
    
    @Column(nullable = false)
    private Double totalTripCost;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.TENTATIVE;
    
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime bookedAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    private LocalDateTime paymentDueAt;
    
    private LocalDateTime paidAt;
    
    private LocalDateTime onboardedAt;
    
    private LocalDateTime deboardedAt;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean driverStartedRide = false;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean passengerStartedRide = false;
    
    private LocalDateTime rideStartedAt;
    
    private LocalDateTime rideEndedAt;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean initialEmailSent = false;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean paymentRequestSent = false;
    
    public enum BookingStatus {
        TENTATIVE, PAYMENT_PENDING, CONFIRMED, CANCELLED, ONBOARDED, DEBOARDED, COMPLETED
    }
}
