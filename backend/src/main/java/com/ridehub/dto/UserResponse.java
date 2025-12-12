package com.ridehub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    
    private Long id;
    private String name;
    private String email;
    private String contact;
    private String age;
    private String role;
    private String gender;
    private String carModel;
    private String licensePlate;
    private String capacity;
}
