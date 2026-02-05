package com.host.challenge;

import com.host.challenge.domain.Role;
import com.host.challenge.domain.User;
import com.host.challenge.domain.enums.RoleName;
import com.host.challenge.repository.RoleRepository;
import com.host.challenge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Initialize Roles
        if (roleRepository.count() == 0) {
            Arrays.stream(RoleName.values()).forEach(name -> roleRepository.save(Role.builder().name(name).build()));
        }

        // Initialize Admin User
        if (userRepository.findByEmail("admin@challenge.com").isEmpty()) {
            Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN).orElseThrow();
            User admin = User.builder()
                    .name("System Admin")
                    .email("admin@challenge.com")
                    .password(passwordEncoder.encode("admin123"))
                    .roles(Collections.singleton(adminRole))
                    .emailVerified(true)
                    .active(true)
                    .build();
            userRepository.save(admin);
        }
    }
}
