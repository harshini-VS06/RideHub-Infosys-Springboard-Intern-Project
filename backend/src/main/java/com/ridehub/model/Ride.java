package com.ridehub.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "rides")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ride {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    @JsonIgnoreProperties({"password", "bookings", "rides", "payments", "hibernateLazyInitializer", "handler"})
    private User driver;
    
    @Column(nullable = false)
    private String source;
    
    @Column(nullable = false)
    private String destination;
    
    @Column(nullable = false)
    private LocalDate rideDate;
    
    @Column(nullable = false)
    private LocalTime rideTime;
    
    @Column(nullable = false)
    private Integer totalSeats;
    
    @Column(nullable = false)
    private Integer availableSeats;
    
    @Column(nullable = false)
    private Double farePerKm;
    
    private Double distance;
    
    @Column(nullable = false)
    private Double sourceLat;
    
    @Column(nullable = false)
    private Double sourceLng;
    
    @Column(nullable = false)
    private Double destLat;
    
    @Column(nullable = false)
    private Double destLng;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RideStatus status = RideStatus.AVAILABLE;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TripStatus tripStatus = TripStatus.SCHEDULED;
    
    private LocalDateTime tripStartedAt;
    
    private LocalDateTime tripCompletedAt;
    
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    public enum RideStatus {
        AVAILABLE, FULL, COMPLETED, CANCELLED
    }
    
    public enum TripStatus {
        SCHEDULED,      // Ride is scheduled, waiting for start
        PICKING_UP,     // Driver has started journey, picking up passengers
        IN_PROGRESS,    // All passengers onboarded, trip in progress
        COMPLETED,      // All passengers deboarded, trip finished
        CANCELLED       // Trip was cancelled
    }
}
