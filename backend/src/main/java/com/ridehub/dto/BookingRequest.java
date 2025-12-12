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
public class BookingRequest {
    
    @NotNull(message = "Ride ID is required")
    private Long rideId;
    
    @NotNull(message = "Seats booked is required")
    @Min(value = 1, message = "At least 1 seat must be booked")
    private Integer seatsBooked;
    
    @NotBlank(message = "Pickup location is required")
    private String pickupLocation;
    
    @NotBlank(message = "Drop location is required")
    private String dropLocation;
    
    private Double segmentDistance;
    
    @NotNull(message = "Pickup latitude is required")
    private Double pickupLat;
    
    @NotNull(message = "Pickup longitude is required")
    private Double pickupLng;
    
    @NotNull(message = "Drop latitude is required")
    private Double dropLat;
    
    @NotNull(message = "Drop longitude is required")
    private Double dropLng;
    
    @NotNull(message = "Total fare is required")
    @Min(value = 0, message = "Total fare must be positive")
    private Double totalFare;
}
