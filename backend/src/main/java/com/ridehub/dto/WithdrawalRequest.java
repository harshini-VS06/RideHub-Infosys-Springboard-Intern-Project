package com.ridehub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawalRequest {
    private Double amount;
    private String bankAccount;
    private String ifscCode;
    private String accountHolderName;
}
