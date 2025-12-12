package com.ridehub.repository;

import com.ridehub.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    Boolean existsByEmail(String email);
    
    Boolean existsByContact(String contact);
    
    // Admin queries
    Long countByRole(User.Role role);
    
    Long countByActive(Boolean active);
}
