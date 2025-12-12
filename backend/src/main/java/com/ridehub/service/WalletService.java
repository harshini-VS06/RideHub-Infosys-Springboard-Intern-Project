package com.ridehub.service;

import com.ridehub.dto.TransactionResponse;
import com.ridehub.dto.WalletResponse;
import com.ridehub.dto.WithdrawalRequest;
import com.ridehub.model.*;
import com.ridehub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {
    
    private final HubWalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;
    
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    @Transactional
    public HubWallet getOrCreateWallet(User driver) {
        if (driver.getRole() != User.Role.DRIVER) {
            throw new RuntimeException("Only drivers can have wallets");
        }
        
        return walletRepository.findByDriver(driver)
                .orElseGet(() -> {
                    HubWallet wallet = HubWallet.builder()
                            .driver(driver)
                            .lockedBalance(0.0)
                            .availableBalance(0.0)
                            .totalEarnings(0.0)
                            .build();
                    return walletRepository.save(wallet);
                });
    }
    
    @Transactional
    public void creditToWallet(User driver, Double amount, Payment payment, Booking booking) {
        log.info("Starting wallet credit - Driver: {}, Amount: {}, Booking: {}", 
                driver.getId(), amount, booking.getId());
        
        HubWallet wallet = getOrCreateWallet(driver);
        
        log.info("Current wallet state - Locked: {}, Available: {}, Total: {}",
                wallet.getLockedBalance(), wallet.getAvailableBalance(), wallet.getTotalEarnings());
        
        // Add to locked balance
        Double oldLocked = wallet.getLockedBalance();
        Double oldTotal = wallet.getTotalEarnings();
        
        wallet.setLockedBalance(wallet.getLockedBalance() + amount);
        wallet.setTotalEarnings(wallet.getTotalEarnings() + amount);
        wallet = walletRepository.save(wallet);
        
        log.info("Updated wallet state - Locked: {} -> {}, Total: {} -> {}",
                oldLocked, wallet.getLockedBalance(), oldTotal, wallet.getTotalEarnings());
        
        // Record transaction
        WalletTransaction transaction = WalletTransaction.builder()
                .wallet(wallet)
                .payment(payment)
                .booking(booking)
                .type(WalletTransaction.TransactionType.CREDIT_LOCKED)
                .amount(amount)
                .balanceAfter(wallet.getLockedBalance())
                .description(String.format("Payment received for booking #%d - Amount locked until ride completion", booking.getId()))
                .build();
        
        transactionRepository.save(transaction);
        
        log.info("Wallet credit completed successfully. Transaction ID: {}", transaction.getId());
        System.out.println("✓ Credited ₹" + amount + " to driver's wallet (locked balance)");
    }
    
    @Transactional
    public void unlockFunds(Booking booking) {
        HubWallet wallet = getOrCreateWallet(booking.getRide().getDriver());
        
        // Calculate amount to unlock based on the booking
        Double amountToUnlock = booking.getFinalPrice();
        
        if (wallet.getLockedBalance() < amountToUnlock) {
            throw new RuntimeException("Insufficient locked balance");
        }
        
        // Move from locked to available
        wallet.setLockedBalance(wallet.getLockedBalance() - amountToUnlock);
        wallet.setAvailableBalance(wallet.getAvailableBalance() + amountToUnlock);
        wallet = walletRepository.save(wallet);
        
        // Record transaction
        WalletTransaction transaction = WalletTransaction.builder()
                .wallet(wallet)
                .booking(booking)
                .type(WalletTransaction.TransactionType.UNLOCK_TO_AVAILABLE)
                .amount(amountToUnlock)
                .balanceAfter(wallet.getAvailableBalance())
                .description(String.format("Funds unlocked for completed ride - Booking #%d", booking.getId()))
                .build();
        
        transactionRepository.save(transaction);
    }
    
    public WalletResponse getMyWallet() {
        User driver = getCurrentUser();
        HubWallet wallet = getOrCreateWallet(driver);
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        return WalletResponse.builder()
                .id(wallet.getId())
                .lockedBalance(wallet.getLockedBalance())
                .availableBalance(wallet.getAvailableBalance())
                .totalEarnings(wallet.getTotalEarnings())
                .createdAt(wallet.getCreatedAt().format(formatter))
                .updatedAt(wallet.getUpdatedAt().format(formatter))
                .build();
    }
    
    public List<TransactionResponse> getMyTransactions() {
        User driver = getCurrentUser();
        HubWallet wallet = getOrCreateWallet(driver);
        
        List<WalletTransaction> transactions = transactionRepository.findByWalletOrderByCreatedAtDesc(wallet);
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        return transactions.stream()
                .map(transaction -> TransactionResponse.builder()
                        .id(transaction.getId())
                        .type(transaction.getType().name())
                        .amount(transaction.getAmount())
                        .balanceAfter(transaction.getBalanceAfter())
                        .description(transaction.getDescription())
                        .createdAt(transaction.getCreatedAt().format(formatter))
                        .bookingId(transaction.getBooking() != null ? transaction.getBooking().getId() : null)
                        .paymentId(transaction.getPayment() != null ? transaction.getPayment().getId() : null)
                        .build())
                .collect(Collectors.toList());
    }
    
    @Transactional
    public String withdrawFunds(WithdrawalRequest request) {
        User driver = getCurrentUser();
        HubWallet wallet = getOrCreateWallet(driver);
        
        if (wallet.getAvailableBalance() < request.getAmount()) {
            throw new RuntimeException("Insufficient available balance");
        }
        
        if (request.getAmount() <= 0) {
            throw new RuntimeException("Withdrawal amount must be greater than zero");
        }
        
        // Deduct from available balance
        wallet.setAvailableBalance(wallet.getAvailableBalance() - request.getAmount());
        wallet = walletRepository.save(wallet);
        
        // Record transaction
        WalletTransaction transaction = WalletTransaction.builder()
                .wallet(wallet)
                .type(WalletTransaction.TransactionType.WITHDRAWAL)
                .amount(request.getAmount())
                .balanceAfter(wallet.getAvailableBalance())
                .description(String.format("Withdrawal to %s (****%s)", 
                        request.getAccountHolderName(), 
                        request.getBankAccount().substring(Math.max(0, request.getBankAccount().length() - 4))))
                .build();
        
        transactionRepository.save(transaction);
        
        log.info("Withdrawal processed: Driver={}, Amount={}, New Balance={}", 
                driver.getId(), request.getAmount(), wallet.getAvailableBalance());
        
        // In production, integrate with payment gateway for actual bank transfer
        return String.format("Withdrawal of ₹%.2f initiated successfully. Funds will be credited to your bank account within 3-5 business days.", request.getAmount());
    }
    
    @Transactional
    public void releaseLockedFunds(Booking booking) {
        User driver = booking.getRide().getDriver();
        HubWallet wallet = getOrCreateWallet(driver);
        
        // Find the payment for this booking
        Payment payment = paymentRepository.findByBooking(booking)
                .orElseThrow(() -> new RuntimeException("Payment not found for booking"));
        
        double amount = payment.getAmount();
        
        // Move from locked to available
        if (wallet.getLockedBalance() < amount) {
            log.warn("Locked balance insufficient. Locked: {}, Required: {}", wallet.getLockedBalance(), amount);
            throw new RuntimeException("Insufficient locked balance");
        }
        
        wallet.setLockedBalance(wallet.getLockedBalance() - amount);
        wallet.setAvailableBalance(wallet.getAvailableBalance() + amount);
        wallet = walletRepository.save(wallet);
        
        // Record transaction
        WalletTransaction transaction = WalletTransaction.builder()
                .wallet(wallet)
                .type(WalletTransaction.TransactionType.RELEASE)
                .amount(amount)
                .balanceAfter(wallet.getAvailableBalance())
                .description(String.format("Ride completed - Booking #%d released to available balance", booking.getId()))
                .booking(booking)
                .payment(payment)
                .build();
        
        transactionRepository.save(transaction);
        
        log.info("Locked funds released: Driver={}, Amount={}, New Available Balance={}", 
                driver.getId(), amount, wallet.getAvailableBalance());
        
        // Send email notification to driver about funds transfer
        try {
            emailService.sendFundsTransferredEmail(driver, booking, amount, wallet.getAvailableBalance());
            log.info("Funds transferred email sent to driver: {}", driver.getEmail());
        } catch (Exception e) {
            log.error("Failed to send funds transferred email: {}", e.getMessage());
        }
    }
}
