package com.host.challenge.repository;

import com.host.challenge.domain.Role;
import com.host.challenge.domain.enums.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);
}
