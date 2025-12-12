package com.ridehub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverRatingResponse {
    
    private Long driverId;
    private String driverName;
    private Double averageRating;
    private Long totalReviews;
    private Map<Integer, Long> ratingDistribution; // Star rating -> count
}
