package com.ridehub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OTPResponse {
    
    private String message;
    private String email;
    private boolean success;
}
