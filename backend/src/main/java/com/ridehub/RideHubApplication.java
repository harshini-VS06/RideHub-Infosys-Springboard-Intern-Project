package com.ridehub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RideHubApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(RideHubApplication.class, args);
    }
}
