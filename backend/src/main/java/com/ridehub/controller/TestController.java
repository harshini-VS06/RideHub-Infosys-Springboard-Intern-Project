package com.ridehub.controller;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/test")
@CrossOrigin(origins = "*")
public class TestController {
    
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    
    @GetMapping("/hash/{password}")
    public Map<String, String> generateHash(@PathVariable String password) {
        String hash = encoder.encode(password);
        
        Map<String, String> response = new HashMap<>();
        response.put("password", password);
        response.put("hash", hash);
        response.put("sql", "UPDATE users SET password = '" + hash + "' WHERE email = 'admin@ridehub.com';");
        
        return response;
    }
    
    @GetMapping("/verify/{password}/{hash}")
    public Map<String, Object> verifyHash(@PathVariable String password, @PathVariable String hash) {
        boolean matches = encoder.matches(password, hash);
        
        Map<String, Object> response = new HashMap<>();
        response.put("password", password);
        response.put("hash", hash);
        response.put("matches", matches);
        
        return response;
    }
}
