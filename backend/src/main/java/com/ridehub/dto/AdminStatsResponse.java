package com.ridehub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatsResponse {
    private Long totalUsers;
    private Long totalDrivers;
    private Long totalPassengers;
    private Long activeUsers;
    private Long totalRides;
    private Long completedRides;
    private Long cancelledRides;
    private Long totalBookings;
    private Long completedBookings;
    private Double totalEarnings;
}
