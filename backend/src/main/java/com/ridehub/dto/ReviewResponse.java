package com.ridehub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {
    
    private Long id;
    private Long bookingId;
    private Long rideId;
    private Long driverId;
    private String driverName;
    private Long passengerId;
    private String passengerName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    
    // Ride details for context
    private String source;
    private String destination;
    private String rideDate;
}
