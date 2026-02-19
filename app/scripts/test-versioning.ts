import { getConfigForPeriod, buildSnapshotFromMetric, hasConfigChanged } from '../src/lib/metricConfig';
import { calculateScoreFromLogs } from '../src/lib/scoring';
import { ScoringFrequency, ComparisonType, AggregationMethod } from '@prisma/client';

/**
 * MOCK DATA & SCENARIOS
 */

const baseMetric = {
    id: 'm1',
    challengeId: 'c1',
    name: 'Steps',
    description: 'Daily steps',
    unit: 'steps',
    inputType: 'NUMBER' as any,
    aggregationMethod: 'SUM' as AggregationMethod,
    scoringFrequency: 'DAILY' as ScoringFrequency,
    pointsPerUnit: null,
    maxPointsPerPeriod: 5,
    maxPointsTotal: null,
    scoringRules: [
        {
            qualifierId: null,
            comparisonType: 'GREATER_THAN_EQUAL' as ComparisonType,
            minValue: 5000,
            maxValue: null,
            points: 1,
        }
    ]
};

const historicalConfig = {
    effectiveFrom: null,
    effectiveTo: "2026-02-10T23:59:59.000Z", // Past configuration
    pointsPerUnit: null,
    maxPointsPerPeriod: 10, // Old cap was higher
    maxPointsTotal: null,
    scoringRules: [
        {
            qualifierId: null,
            comparisonType: "GREATER_THAN_EQUAL",
            minValue: 1000, // Old rule was easier
            maxValue: null,
            points: 1,
        }
    ]
};

const metricWithHistory = {
    ...baseMetric,
    configHistory: [historicalConfig]
};

const mockParticipant = {
    id: 'p1',
    userId: 'u1',
    name: 'Test Athlete',
    displayName: 'Athlete'
};

async function runTests() {
    console.log("🚀 Starting Scoring Versioning Logic Tests...\n");

    let passed = 0;
    let failed = 0;

    const test = (name: string, fn: () => void) => {
        try {
            fn();
            console.log(`✅ PASS: ${name}`);
            passed++;
        } catch (e: any) {
            console.error(`❌ FAIL: ${name}\n   Error: ${e.message}`);
            failed++;
        }
    };

    // ---------------------------------------------------------
    // TEST 1: getConfigForPeriod
    // ---------------------------------------------------------
    test("getConfigForPeriod: Should return historical config for past date", () => {
        const pastDate = new Date("2026-02-05T12:00:00Z");
        const config = getConfigForPeriod(metricWithHistory.configHistory, pastDate, pastDate);
        if (!config || config.maxPointsPerPeriod !== 10) {
            throw new Error(`Expected maxPointsPerPeriod 10, got ${config?.maxPointsPerPeriod}`);
        }
    });

    test("getConfigForPeriod: Should return null for recent date (uses current config)", () => {
        const recentDate = new Date("2026-02-15T12:00:00Z");
        const config = getConfigForPeriod(metricWithHistory.configHistory, recentDate, recentDate);
        if (config !== null) {
            throw new Error("Expected null for recent date, but got a historical entry");
        }
    });

    // ---------------------------------------------------------
    // TEST 2: hasConfigChanged
    // ---------------------------------------------------------
    test("hasConfigChanged: Should detect change in maxPointsPerPeriod", () => {
        const oldSnap = buildSnapshotFromMetric(baseMetric);
        const newSnap = { ...oldSnap, maxPointsPerPeriod: 20 };
        if (!hasConfigChanged(oldSnap, newSnap)) {
            throw new Error("Failed to detect change in maxPointsPerPeriod");
        }
    });

    test("hasConfigChanged: Should detect change in scoringRules", () => {
        const oldSnap = buildSnapshotFromMetric(baseMetric);
        const newSnap = { ...oldSnap, scoringRules: [] };
        if (!hasConfigChanged(oldSnap, newSnap)) {
            throw new Error("Failed to detect change in scoringRules");
        }
    });

    // ---------------------------------------------------------
    // TEST 3: calculateScoreFromLogs (VERSIONING LOGIC)
    // ---------------------------------------------------------
    test("Scoring: Should use OLD rules for past logs", () => {
        // Log of 2000 steps on Feb 5th.
        // Current rules: >= 5000 (0 pts)
        // Historical rules: >= 1000 (1 pt)
        const pastLog = [{
            id: 'l1',
            userId: 'u1',
            participantId: 'p1',
            challengeId: 'c1',
            metricId: 'm1',
            qualifierId: null,
            value: 2000, // Meets old rule, but not new
            date: new Date("2026-02-05T12:00:00Z"),
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date()
        }];

        const result = calculateScoreFromLogs(pastLog as any, metricWithHistory as any, mockParticipant as any);
        if (result.totalPoints !== 1) {
            throw new Error(`Expected 1 point from old rule, but got ${result.totalPoints}`);
        }
    });

    test("Scoring: Should use NEW rules for recent logs", () => {
        // Log of 2000 steps on Feb 15th.
        // Current rules: >= 5000 (0 pts)
        const recentLog = [{
            id: 'l2',
            userId: 'u1',
            participantId: 'p1',
            challengeId: 'c1',
            metricId: 'm1',
            qualifierId: null,
            value: 2000, // Does NOT meet new rule
            date: new Date("2026-02-15T12:00:00Z"),
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date()
        }];

        const result = calculateScoreFromLogs(recentLog as any, metricWithHistory as any, mockParticipant as any);
        if (result.totalPoints !== 0) {
            throw new Error(`Expected 0 points from new rule, but got ${result.totalPoints}`);
        }
    });

    test("Scoring: Mixed periods should sum correctly", () => {
        const mixedLogs = [
            {
                id: 'l1', value: 2000, date: new Date("2026-02-05T12:00:00Z"), // Old rule: +1pt
                createdAt: new Date()
            },
            {
                id: 'l2', value: 6000, date: new Date("2026-02-15T12:00:00Z"), // New rule: +1pt
                createdAt: new Date()
            }
        ];

        const result = calculateScoreFromLogs(mixedLogs as any, metricWithHistory as any, mockParticipant as any);
        if (result.totalPoints !== 2) {
            throw new Error(`Expected 2 points total, but got ${result.totalPoints}`);
        }
    });

    console.log("\n--- TEST SUMMARY ---");
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
