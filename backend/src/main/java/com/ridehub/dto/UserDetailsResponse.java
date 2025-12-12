package com.ridehub.dto;

import com.ridehub.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDetailsResponse {
    private User user;
    private Long totalRides;
    private Long completedRides;
    private Long totalBookings;
    private Long completedBookings;
    private Double averageRating;
    private Long totalReviews;
}
