export interface MetricConfigSnapshot {
    effectiveFrom: string | null;  // ISO date, null = from beginning
    effectiveTo: string | null;    // ISO date, null = currently active
    description?: string | null;
    pointsPerUnit: number | null;
    maxPointsPerPeriod: number | null;
    maxPointsTotal: number | null;
    scoringRules: {
        comparisonType: string;
        minValue: number | null;
        maxValue: number | null;
        points: number;
        qualifierId: string | null;
    }[];
}

/**
 * Find the historical config that was active during a given period.
 * Returns null if no historical config applies (use current column values).
 */
export function getConfigForPeriod(
    configHistory: unknown,
    periodStart: Date,
    periodEnd: Date
): MetricConfigSnapshot | null {
    const history = Array.isArray(configHistory)
        ? (configHistory as MetricConfigSnapshot[])
        : [];

    return history.find(h =>
        (h.effectiveFrom === null || new Date(h.effectiveFrom) <= periodEnd) &&
        (h.effectiveTo === null || new Date(h.effectiveTo) >= periodStart)
    ) ?? null;
}

/**
 * Build a config snapshot from current metric column values + scoring rules.
 */
export function buildSnapshotFromMetric(metric: {
    description: string | null;
    pointsPerUnit: number | null;
    maxPointsPerPeriod: number | null;
    maxPointsTotal: number | null;
    scoringRules: {
        comparisonType: string;
        minValue: number | null;
        maxValue: number | null;
        points: number;
        qualifierId: string | null;
    }[];
}): Omit<MetricConfigSnapshot, 'effectiveFrom' | 'effectiveTo'> {
    return {
        description: metric.description,
        pointsPerUnit: metric.pointsPerUnit,
        maxPointsPerPeriod: metric.maxPointsPerPeriod,
        maxPointsTotal: metric.maxPointsTotal,
        scoringRules: metric.scoringRules.map(r => ({
            comparisonType: r.comparisonType,
            minValue: r.minValue,
            maxValue: r.maxValue,
            points: r.points,
            qualifierId: r.qualifierId,
        })),
    };
}

/**
 * Check if scoring-relevant config has changed between two snapshots.
 */
export function hasConfigChanged(
    a: Omit<MetricConfigSnapshot, 'effectiveFrom' | 'effectiveTo'>,
    b: Omit<MetricConfigSnapshot, 'effectiveFrom' | 'effectiveTo'>
): boolean {
    return JSON.stringify(a) !== JSON.stringify(b);
}
