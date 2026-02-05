package com.host.challenge.service;

import com.host.challenge.domain.Challenge;
import com.host.challenge.domain.ChallengeParticipant;
import com.host.challenge.domain.ScoreSnapshot;
import com.host.challenge.repository.ChallengeParticipantRepository;
import com.host.challenge.repository.ScoreSnapshotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final ScoringService scoringService;
    private final ScoreSnapshotRepository snapshotRepository;
    private final ChallengeParticipantRepository participantRepository;

    @Transactional
    public void createScoreSnapshots(Challenge challenge) {
        LocalDateTime now = LocalDateTime.now();

        challenge.getMetrics().forEach(metric -> {
            // This is a simplified version. Usually you'd aggregate all metrics for a final
            // score.
            // For this demo, let's assume we snapshot per participant across all their
            // metrics.
        });

        // Placeholder for real logic
    }

    // Example method to get leaderboard
    public List<ScoreSnapshot> getLeaderboard(Long challengeId) {
        // Return latest snapshots
        return snapshotRepository.findAll().stream()
                .filter(s -> s.getParticipant().getChallenge().getId().equals(challengeId))
                .sorted(Comparator.comparingInt(ScoreSnapshot::getTotalScore).reversed())
                .collect(Collectors.toList());
    }
}
