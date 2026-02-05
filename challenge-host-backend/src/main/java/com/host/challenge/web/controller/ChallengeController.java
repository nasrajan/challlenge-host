package com.host.challenge.web.controller;

import com.host.challenge.domain.Challenge;
import com.host.challenge.domain.User;
import com.host.challenge.repository.UserRepository;
import com.host.challenge.service.ChallengeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeService challengeService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<Challenge> create(@RequestBody Challenge challenge,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(challengeService.createChallenge(challenge, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Challenge> update(@PathVariable Long id, @RequestBody Challenge challenge,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(challengeService.updateChallenge(id, challenge, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        challengeService.deleteChallenge(id, user);
        return ResponseEntity.noContent().build();
    }
}
