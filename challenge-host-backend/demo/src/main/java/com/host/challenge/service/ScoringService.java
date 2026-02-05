package com.host.challenge.service;

import com.host.challenge.domain.*;
import com.host.challenge.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScoringService {

    private final ActivityLogRepository activityLogRepository;

    public int calculateScoreForMetric(ChallengeParticipant participant, ChallengeMetric metric,
            LocalDateTime start, LocalDateTime end) {
        List<ActivityLog> logs = activityLogRepository.findByParticipantIdAndMetricIdAndLogDateBetween(
                participant.getId(), metric.getId(), start, end);

        if (logs.isEmpty())
            return 0;

        double aggregatedValue = 0;
        switch (metric.getAggregationMethod()) {
            case SUM -> aggregatedValue = logs.stream().mapToDouble(ActivityLog::getValue).sum();
            case AVERAGE -> aggregatedValue = logs.stream().mapToDouble(ActivityLog::getValue).average().orElse(0);
            case MAX -> aggregatedValue = logs.stream().mapToDouble(ActivityLog::getValue).max().orElse(0);
            case MIN -> aggregatedValue = logs.stream().mapToDouble(ActivityLog::getValue).min().orElse(0);
        }

        return findPointsInBrackets(metric.getBrackets(), aggregatedValue);
    }

    private int findPointsInBrackets(List<ScoringBracket> brackets, double value) {
        return brackets.stream()
                .filter(b -> value >= b.getMinValue() && value <= b.getMaxValue())
                .map(ScoringBracket::getPoints)
                .findFirst()
                .orElse(0);
    }
}
