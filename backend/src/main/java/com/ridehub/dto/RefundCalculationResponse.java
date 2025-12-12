package com.ridehub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundCalculationResponse {
    private Double originalAmount;
    private Double refundAmount;
    private Double penaltyAmount;
    private Double refundPercentage;
    private Double penaltyPercentage;
    private Long hoursUntilTrip;
    private String reason;
    private String policy;
}
