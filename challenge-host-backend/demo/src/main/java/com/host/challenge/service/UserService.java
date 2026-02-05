package com.host.challenge.service;

import com.host.challenge.domain.Role;
import com.host.challenge.domain.User;
import com.host.challenge.domain.enums.RoleName;
import com.host.challenge.exception.ApiException;
import com.host.challenge.repository.RoleRepository;
import com.host.challenge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(String name, String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new ApiException("Email already in use", HttpStatus.BAD_REQUEST);
        }

        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseThrow(() -> new ApiException("User Role not set.", HttpStatus.INTERNAL_SERVER_ERROR));

        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .roles(Collections.singleton(userRole))
                .emailVerified(false)
                .active(true)
                .build();

        return userRepository.save(user);
    }

    @Transactional
    public User processOAuthPostLogin(String name, String email, String providerId) {
        return userRepository.findByEmail(email)
                .map(user -> {
                    user.setName(name);
                    user.setProviderId(providerId);
                    user.setEmailVerified(true);
                    return userRepository.save(user);
                })
                .orElseGet(() -> {
                    Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                            .orElseThrow(
                                    () -> new ApiException("User Role not set.", HttpStatus.INTERNAL_SERVER_ERROR));

                    User newUser = User.builder()
                            .name(name)
                            .email(email)
                            .providerId(providerId)
                            .roles(Collections.singleton(userRole))
                            .emailVerified(true)
                            .active(true)
                            .build();
                    return userRepository.save(newUser);
                });
    }

    @Transactional
    public void verifyEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
        user.setEmailVerified(true);
        userRepository.save(user);
    }
}
