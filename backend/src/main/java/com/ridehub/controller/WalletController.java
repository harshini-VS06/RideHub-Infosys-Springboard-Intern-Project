package com.ridehub.controller;

import com.ridehub.dto.TransactionResponse;
import com.ridehub.dto.WalletResponse;
import com.ridehub.dto.WithdrawalRequest;
import com.ridehub.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/wallet")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class WalletController {
    
    private final WalletService walletService;
    
    @GetMapping("/my-wallet")
    public ResponseEntity<WalletResponse> getMyWallet() {
        try {
            WalletResponse wallet = walletService.getMyWallet();
            log.info("Wallet fetched successfully: Locked={}, Available={}, Total={}", 
                wallet.getLockedBalance(), wallet.getAvailableBalance(), wallet.getTotalEarnings());
            return ResponseEntity.ok(wallet);
        } catch (Exception e) {
            log.error("Error fetching wallet: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/transactions")
    public ResponseEntity<List<TransactionResponse>> getMyTransactions() {
        try {
            List<TransactionResponse> transactions = walletService.getMyTransactions();
            log.info("Fetched {} transactions", transactions.size());
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            log.error("Error fetching transactions: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/withdraw")
    public ResponseEntity<?> withdrawFunds(@RequestBody WithdrawalRequest request) {
        try {
            String message = walletService.withdrawFunds(request);
            Map<String, String> response = new HashMap<>();
            response.put("message", message);
            log.info("Withdrawal successful: Amount={}", request.getAmount());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing withdrawal: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
