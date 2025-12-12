package com.ridehub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancellationRequest {
    private String reason;
    private Boolean acknowledged; // User acknowledges penalty terms
}
