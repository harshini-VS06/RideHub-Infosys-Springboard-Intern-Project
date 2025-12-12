package com.ridehub.repository;

import com.ridehub.model.WalletTransaction;
import com.ridehub.model.HubWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    List<WalletTransaction> findByWalletOrderByCreatedAtDesc(HubWallet wallet);
    List<WalletTransaction> findByWalletIdOrderByCreatedAtDesc(Long walletId);
}
