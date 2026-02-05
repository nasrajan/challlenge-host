package com.host.challenge.repository;

import com.host.challenge.domain.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByParticipantIdAndMetricIdAndLogDateBetween(
            Long participantId, Long metricId, LocalDateTime start, LocalDateTime end);
}
