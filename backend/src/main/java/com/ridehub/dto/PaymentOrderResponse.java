package com.ridehub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentOrderResponse {
    private String razorpayOrderId;
    private Double amount;
    private String currency;
    private Long bookingId;
    private String razorpayKey;
}
