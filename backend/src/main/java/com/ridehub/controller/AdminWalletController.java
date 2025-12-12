package com.ridehub.controller;

import com.ridehub.dto.ApiResponse;
import com.ridehub.service.WalletSchedulerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin controller for wallet-related administrative operations
 */
@RestController
@RequestMapping("/admin/wallet")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AdminWalletController {
    
    private final WalletSchedulerService walletSchedulerService;
    
    /**
     * Manually trigger fund release for all completed rides
     * Useful for immediately processing locked funds without waiting for scheduled job
     * Available to all authenticated users (no admin required)
     */
    @PostMapping("/release-locked-funds")
    public ResponseEntity<ApiResponse<String>> releaseLockedFunds() {
        try {
            log.info("Manual fund release triggered via API");
            String result = walletSchedulerService.manualReleaseCompletedRideFunds();
            return ResponseEntity.ok(new ApiResponse<>(true, result, null));
        } catch (Exception e) {
            log.error("Error in manual fund release: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Fund release failed: " + e.getMessage(), null));
        }
    }
}
