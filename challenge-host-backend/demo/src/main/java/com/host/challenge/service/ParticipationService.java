package com.host.challenge.service;

import com.host.challenge.domain.Challenge;
import com.host.challenge.domain.ChallengeParticipant;
import com.host.challenge.domain.User;
import com.host.challenge.domain.enums.ParticipationStatus;
import com.host.challenge.exception.ApiException;
import com.host.challenge.repository.ChallengeParticipantRepository;
import com.host.challenge.repository.ChallengeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ParticipationService {

    private final ChallengeRepository challengeRepository;
    private final ChallengeParticipantRepository participantRepository;

    @Transactional
    public ChallengeParticipant joinChallenge(Long challengeId, User user) {
        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new ApiException("Challenge not found", HttpStatus.NOT_FOUND));

        if (participantRepository.existsByUserIdAndChallengeId(user.getId(), challengeId)) {
            throw new ApiException("Already joined this challenge", HttpStatus.BAD_REQUEST);
        }

        ParticipationStatus initialStatus = challenge.isApprovalRequired() ? ParticipationStatus.PENDING
                : ParticipationStatus.APPROVED;

        ChallengeParticipant participant = ChallengeParticipant.builder()
                .challenge(challenge)
                .user(user)
                .status(initialStatus)
                .joinedAt(LocalDateTime.now())
                .build();

        return participantRepository.save(participant);
    }

    @Transactional
    public void updateParticipationStatus(Long participationId, ParticipationStatus status, User organizer) {
        ChallengeParticipant participant = participantRepository.findById(participationId)
                .orElseThrow(() -> new ApiException("Participation record not found", HttpStatus.NOT_FOUND));

        if (!participant.getChallenge().getOrganizer().getId().equals(organizer.getId())) {
            throw new ApiException("Access denied", HttpStatus.FORBIDDEN);
        }

        participant.setStatus(status);
        participant.setStatusChangedAt(LocalDateTime.now());
        participant.setStatusChangedBy(organizer);
        participantRepository.save(participant);
    }
}
