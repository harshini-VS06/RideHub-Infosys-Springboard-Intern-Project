package com.ridehub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RideResponse {
    
    private Long id;
    private String source;
    private String destination;
    private String rideDate;
    private String rideTime;
    private Integer totalSeats;
    private Integer availableSeats;
    private Double farePerKm;
    private Double distance;
    private Double sourceLat;
    private Double sourceLng;
    private Double destLat;
    private Double destLng;
    private String status;
    
    // Driver information
    private String driver;
    private String driverGender;
    private String car;
    private String licensePlate;
    private Long driverId;
    private Double driverAverageRating;
    private Long driverTotalReviews;
}
