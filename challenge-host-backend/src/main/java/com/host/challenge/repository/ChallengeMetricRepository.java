package com.host.challenge.repository;

import com.host.challenge.domain.ChallengeMetric;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChallengeMetricRepository extends JpaRepository<ChallengeMetric, Long> {
}
