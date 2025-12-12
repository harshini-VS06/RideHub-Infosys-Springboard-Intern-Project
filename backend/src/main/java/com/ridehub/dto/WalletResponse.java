package com.ridehub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletResponse {
    private Long id;
    private Double lockedBalance;
    private Double availableBalance;
    private Double totalEarnings;
    private String createdAt;
    private String updatedAt;
}
