package com.host.challenge.repository;

import com.host.challenge.domain.ChallengeParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChallengeParticipantRepository extends JpaRepository<ChallengeParticipant, Long> {
    Optional<ChallengeParticipant> findByUserIdAndChallengeId(Long userId, Long challengeId);

    boolean existsByUserIdAndChallengeId(Long userId, Long challengeId);
}
