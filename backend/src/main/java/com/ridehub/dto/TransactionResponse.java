package com.ridehub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private Long id;
    private String type;
    private Double amount;
    private Double balanceAfter;
    private String description;
    private String createdAt;
    private Long bookingId;
    private Long paymentId;
}
