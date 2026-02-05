package com.host.challenge.repository;

import com.host.challenge.domain.ScoreSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScoreSnapshotRepository extends JpaRepository<ScoreSnapshot, Long> {
}
