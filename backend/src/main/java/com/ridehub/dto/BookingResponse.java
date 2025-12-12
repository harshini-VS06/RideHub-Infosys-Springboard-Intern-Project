package com.ridehub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {
    
    private Long id;
    private Long rideId;
    private String source;
    private String destination;
    private String rideDate;
    private String rideTime;
    private Integer seatsBooked;
    private String pickupLocation;
    private String dropLocation;
    private Double segmentDistance;
    private Double totalFare; // For backward compatibility
    private Double maximumPrice;
    private Double finalPrice;
    private Double totalTripCost;
    private String status;
    private String bookedAt;
    private String paymentDueAt;
    private String paidAt;
    
    // Driver information
    private String driver;
    private String driverGender;
    private String car;
    private String licensePlate;
    private String driverContact;
    
    // Passenger information
    private String passengerName;
    private String passengerContact;
}
