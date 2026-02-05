package com.host.challenge.service;

import com.host.challenge.domain.Challenge;
import com.host.challenge.domain.User;
import com.host.challenge.domain.enums.ChallengeStatus;
import com.host.challenge.exception.ApiException;
import com.host.challenge.repository.ChallengeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ChallengeService {

    private final ChallengeRepository challengeRepository;

    @Transactional
    public Challenge createChallenge(Challenge challenge, User organizer) {
        challenge.setOrganizer(organizer);
        challenge.setStatus(ChallengeStatus.DRAFT);
        return challengeRepository.save(challenge);
    }

    @Transactional
    public Challenge updateChallenge(Long id, Challenge updatedData, User user) {
        Challenge challenge = challengeRepository.findById(id)
                .orElseThrow(() -> new ApiException("Challenge not found", HttpStatus.NOT_FOUND));

        if (!challenge.getOrganizer().getId().equals(user.getId())) {
            throw new ApiException("Only organizer can update", HttpStatus.FORBIDDEN);
        }

        if (challenge.getStartDate().isBefore(LocalDateTime.now())) {
            throw new ApiException("Cannot edit challenge after it has started", HttpStatus.BAD_REQUEST);
        }

        challenge.setTitle(updatedData.getTitle());
        challenge.setDescription(updatedData.getDescription());
        challenge.setStartDate(updatedData.getStartDate());
        challenge.setEndDate(updatedData.getEndDate());
        challenge.setPublicEntry(updatedData.isPublicEntry());
        challenge.setMaxParticipants(updatedData.getMaxParticipants());
        challenge.setApprovalRequired(updatedData.isApprovalRequired());

        return challengeRepository.save(challenge);
    }

    @Transactional
    public void deleteChallenge(Long id, User user) {
        Challenge challenge = challengeRepository.findById(id)
                .orElseThrow(() -> new ApiException("Challenge not found", HttpStatus.NOT_FOUND));

        if (!challenge.getOrganizer().getId().equals(user.getId())) {
            throw new ApiException("Only organizer can delete", HttpStatus.FORBIDDEN);
        }

        challengeRepository.delete(challenge);
    }
}
