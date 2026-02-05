package com.host.challenge.domain;

import com.host.challenge.domain.enums.AggregationMethod;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "challenge_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChallengeMetric {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AggregationMethod aggregationMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_id", nullable = false)
    private Challenge challenge;

    @OneToMany(mappedBy = "metric", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ScoringBracket> brackets = new ArrayList<>();
}
