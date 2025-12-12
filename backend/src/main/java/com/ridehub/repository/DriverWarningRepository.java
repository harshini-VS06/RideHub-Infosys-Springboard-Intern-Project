package com.ridehub.repository;

import com.ridehub.model.DriverWarning;
import com.ridehub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DriverWarningRepository extends JpaRepository<DriverWarning, Long> {
    
    List<DriverWarning> findByDriverOrderByIssuedAtDesc(User driver);
    
    List<DriverWarning> findByDriverAndResolvedFalse(User driver);
    
    Long countByDriverAndIssuedAtAfterAndResolvedFalse(User driver, LocalDateTime after);
    
    Long countByDriverAndResolvedFalse(User driver);
}
