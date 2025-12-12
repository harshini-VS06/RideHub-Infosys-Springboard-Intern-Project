package com.ridehub.dto;

import com.ridehub.model.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private Long id;
    private Long bookingId;
    private Long passengerId;
    private String passengerName;
    private Long driverId;
    private String driverName;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private Double amount;
    private String status;
    private String paymentMethod;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
