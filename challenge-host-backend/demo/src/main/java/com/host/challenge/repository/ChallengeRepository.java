package com.host.challenge.repository;

import com.host.challenge.domain.Challenge;
import com.host.challenge.domain.enums.ChallengeStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChallengeRepository extends JpaRepository<Challenge, Long> {
    List<Challenge> findByStatus(ChallengeStatus status);
}
