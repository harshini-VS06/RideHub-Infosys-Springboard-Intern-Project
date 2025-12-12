package com.ridehub.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "driver_warnings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverWarning {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private User driver;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ride_id")
    private Ride ride;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WarningType warningType;
    
    @Column(columnDefinition = "TEXT")
    private String reason;
    
    @CreationTimestamp
    @Column(updatable = false, nullable = false)
    private LocalDateTime issuedAt;
    
    @Column(nullable = false)
    private Boolean resolved = false;
    
    private LocalDateTime resolvedAt;
    
    public enum WarningType {
        LATE_CANCELLATION,      // Cancelled within 48 hours
        LAST_MINUTE_CANCELLATION, // Cancelled within 1 hour
        NO_SHOW,                // Did not start trip
        PASSENGER_COMPLAINT,    // Passenger filed complaint
        SAFETY_VIOLATION        // Safety rules violated
    }
}
