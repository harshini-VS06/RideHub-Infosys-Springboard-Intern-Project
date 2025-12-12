package com.ridehub.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRideRequest {
    
    @NotBlank(message = "Source is required")
    private String source;
    
    @NotBlank(message = "Destination is required")
    private String destination;
    
    @NotBlank(message = "Ride date is required")
    private String rideDate;
    
    @NotBlank(message = "Ride time is required")
    private String rideTime;
    
    @NotNull(message = "Total seats is required")
    @Min(value = 1, message = "Total seats must be at least 1")
    private Integer totalSeats;
    
    @NotNull(message = "Fare per km is required")
    @Min(value = 0, message = "Fare per km must be positive")
    private Double farePerKm;
    
    private Double distance;
    
    @NotNull(message = "Source latitude is required")
    private Double sourceLat;
    
    @NotNull(message = "Source longitude is required")
    private Double sourceLng;
    
    @NotNull(message = "Destination latitude is required")
    private Double destLat;
    
    @NotNull(message = "Destination longitude is required")
    private Double destLng;
}
