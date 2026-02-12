import { prisma } from "./prisma";
import {
    AggregationMethod,
    ScoringFrequency,
    ComparisonType,
    ChallengeMetric,
    MetricQualifier,
    ScoringRule,
    ActivityLog
} from "@prisma/client";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

export interface Period {
    start: Date;
    end: Date;
}

export function getPeriodInterval(date: Date, frequency: ScoringFrequency): Period {
    let start, end;
    switch (frequency) {
        case "DAILY":
            start = startOfDay(date);
            end = endOfDay(date);
            break;
        case "WEEKLY":
            start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
            end = endOfWeek(date, { weekStartsOn: 1 });
            break;
        case "MONTHLY":
            start = startOfMonth(date);
            end = endOfMonth(date);
            break;
    }
    return { start: start!, end: end! };
}

export async function calculateParticipantScoreForMetric(
    participantId: string,
    metricId: string,
    asOfDate: Date = new Date()
) {
    const metric = await prisma.challengeMetric.findUnique({
        where: { id: metricId },
        include: {
            scoringRules: true,
            qualifiers: true,
            challenge: true,
        }
    });

    if (!metric) return null;

    const participant = await prisma.participant.findUnique({
        where: { id: participantId }
    });

    if (!participant) return null;

    const logs = await prisma.activityLog.findMany({
        where: {
            participantId,
            metricId,
            date: {
                gte: metric.challenge.startDate,
                lte: metric.challenge.endDate,
            }
        },
        orderBy: { date: 'asc' }
    });

    // Group logs by scoring period
    const periodsLogs: Map<string, ActivityLog[]> = new Map();
    logs.forEach(log => {
        const { start } = getPeriodInterval(log.date, metric.scoringFrequency);
        const key = start.toISOString();
        if (!periodsLogs.has(key)) periodsLogs.set(key, []);
        periodsLogs.get(key)!.push(log);
    });

    let totalCumulativePoints = 0;
    const snapshots = [];

    // Iterate through periods
    for (const [periodKey, logsInPeriod] of periodsLogs) {
        const { start, end } = getPeriodInterval(new Date(periodKey), metric.scoringFrequency);

        // Group logs in period by qualifier
        const qualifierGroups: Map<string | null, number> = new Map();

        logsInPeriod.forEach(log => {
            const qId = log.qualifierId || null;
            const currentVal = qualifierGroups.get(qId) || 0;

            if (metric.aggregationMethod === "COUNT") {
                qualifierGroups.set(qId, currentVal + 1);
            } else if (metric.aggregationMethod === "SUM") {
                qualifierGroups.set(qId, currentVal + log.value);
            } else if (metric.aggregationMethod === "MAX") {
                qualifierGroups.set(qId, Math.max(currentVal, log.value));
            } else if (metric.aggregationMethod === "MIN") {
                qualifierGroups.set(qId, currentVal === 0 ? log.value : Math.min(currentVal, log.value));
            } else if (metric.aggregationMethod === "AVERAGE") {
                qualifierGroups.set(qId, currentVal + log.value);
            }
        });

        if (metric.aggregationMethod === "AVERAGE") {
            qualifierGroups.forEach((val, qId) => {
                const count = logsInPeriod.filter(l => (l.qualifierId || null) === qId).length;
                qualifierGroups.set(qId, val / count);
            });
        }

        let periodRawPoints = 0;

        // Apply rules for each qualifier group
        qualifierGroups.forEach((aggregatedValue, qualifierId) => {
            const relevantRules = metric.scoringRules.filter(rule => rule.qualifierId === qualifierId);

            const rulesToEvaluate = relevantRules.length > 0
                ? relevantRules
                : metric.scoringRules.filter(rule => rule.qualifierId === null);

            rulesToEvaluate.forEach(rule => {
                let matches = false;
                switch (rule.comparisonType) {
                    case "RANGE":
                        matches = aggregatedValue >= (rule.minValue || 0) && aggregatedValue <= (rule.maxValue || Infinity);
                        break;
                    case "GREATER_THAN":
                        matches = aggregatedValue > (rule.minValue || 0);
                        break;
                    case "GREATER_THAN_EQUAL":
                        matches = aggregatedValue >= (rule.minValue || 0);
                        break;
                }

                if (matches) {
                    periodRawPoints += rule.points;
                }
            });
        });

        // Apply Period Cap
        let periodCappedPoints = periodRawPoints;
        if (metric.maxPointsPerPeriod !== null) {
            periodCappedPoints = Math.min(periodRawPoints, metric.maxPointsPerPeriod);
        }

        totalCumulativePoints += periodCappedPoints;

        // Apply Total Cap
        if (metric.maxPointsTotal !== null) {
            totalCumulativePoints = Math.min(totalCumulativePoints, metric.maxPointsTotal);
        }

        snapshots.push({
            userId: participant.userId,
            participantId,
            challengeId: metric.challengeId,
            metricId: metric.id,
            displayName: participant.displayName || participant.name,
            periodStart: start,
            periodEnd: end,
            rawPoints: periodRawPoints,
            cappedPoints: periodCappedPoints,
            totalPoints: totalCumulativePoints
        });
    }

    // Update ScoreSnapshots in DB
    // First clear existing snapshots for this participant/metric
    await prisma.scoreSnapshot.deleteMany({
        where: { participantId, metricId }
    });

    await prisma.scoreSnapshot.createMany({
        data: snapshots
    });

    return totalCumulativePoints;
}

export async function recalculateParticipantChallengeScore(participantId: string, challengeId: string) {
    const metrics = await prisma.challengeMetric.findMany({
        where: { challengeId }
    });

    let grandTotal = 0;
    for (const metric of metrics) {
        const metricScore = await calculateParticipantScoreForMetric(participantId, metric.id);
        grandTotal += metricScore || 0;
    }

    return grandTotal;
}
