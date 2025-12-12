package com.ridehub.repository;

import com.ridehub.model.HubWallet;
import com.ridehub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HubWalletRepository extends JpaRepository<HubWallet, Long> {
    Optional<HubWallet> findByDriver(User driver);
    Optional<HubWallet> findByDriverId(Long driverId);
}
