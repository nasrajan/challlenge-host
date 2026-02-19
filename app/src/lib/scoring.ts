import { prisma } from "./prisma";
import {
    Participant,
    ScoringFrequency,
    ScoringRule,
    ActivityLog
} from "@prisma/client";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, differenceInCalendarDays, addDays } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { getConfigForPeriod } from "./metricConfig";

export interface Period {
    start: Date;
    end: Date;
}

export function getPeriodInterval(date: Date, frequency: ScoringFrequency, timeZone: string = "UTC", challengeStartDate?: Date): Period {
    let start, end;
    // accurate start/end based on timezone
    const zonedDate = toZonedTime(date, timeZone);

    switch (frequency) {
        case "DAILY":
            start = startOfDay(zonedDate);
            end = endOfDay(zonedDate);
            break;
        case "WEEKLY":
            if (challengeStartDate) {
                const zonedStartDate = toZonedTime(challengeStartDate, timeZone);
                const daysSinceStart = differenceInCalendarDays(zonedDate, zonedStartDate);
                const weeksSinceStart = Math.floor(daysSinceStart / 7);
                start = startOfDay(addDays(zonedStartDate, weeksSinceStart * 7));
                end = endOfDay(addDays(start, 6));
            } else {
                start = startOfWeek(zonedDate, { weekStartsOn: 1 }); // Monday start
                end = endOfWeek(zonedDate, { weekStartsOn: 1 });
            }
            break;
        case "MONTHLY":
            start = startOfMonth(zonedDate);
            end = endOfMonth(zonedDate);
            break;
    }

    // Convert back to UTC instant
    return {
        start: fromZonedTime(start!, timeZone),
        end: fromZonedTime(end!, timeZone)
    };
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
            date: { lte: asOfDate }
        },
        orderBy: { date: 'asc' }
    });

    const { totalPoints, snapshots } = calculateScoreFromLogs(logs, metric, participant, metric.challenge.timezone, metric.challenge.startDate);

    // Update ScoreSnapshots in DB
    // First clear existing snapshots for this participant/metric
    await prisma.scoreSnapshot.deleteMany({
        where: { participantId, metricId }
    });

    await prisma.scoreSnapshot.createMany({
        data: snapshots
    });

    return totalPoints;
}

type ScoreMetric = {
    id: string
    challengeId: string
    aggregationMethod: "COUNT" | "SUM" | "MAX" | "MIN" | "AVERAGE"
    scoringFrequency: ScoringFrequency
    pointsPerUnit: number | null
    maxPointsPerPeriod: number | null
    maxPointsTotal: number | null
    scoringRules: Pick<ScoringRule, "qualifierId" | "comparisonType" | "minValue" | "maxValue" | "points">[]
    configHistory?: any // Added for versioning
    challenge?: {
        startDate: Date
    }
}
type ScoreParticipant = Pick<Participant, "id" | "userId" | "name" | "displayName">

export function calculateScoreFromLogs(logs: ActivityLog[], metric: ScoreMetric, participant: ScoreParticipant, timeZone: string = "UTC", challengeStartDate?: Date) {
    const effectiveChallengeStartDate = challengeStartDate || metric.challenge?.startDate;
    // Filter logs to only keep the latest entry per (Date, Qualifier)
    const latestLogsMap: Map<string, ActivityLog> = new Map();
    logs.forEach(log => {
        // Use timezone to determine the "Day" key
        const dateKey = format(toZonedTime(log.date, timeZone), 'yyyy-MM-dd');
        const key = `${dateKey}_${log.qualifierId || 'null'}`;
        const existing = latestLogsMap.get(key);
        if (!existing || new Date(log.createdAt) > new Date(existing.createdAt)) {
            latestLogsMap.set(key, log);
        }
    });

    const filteredLogs = Array.from(latestLogsMap.values());

    // Group logs by scoring period
    const periodsLogs: Map<string, ActivityLog[]> = new Map();
    filteredLogs.forEach(log => {
        const { start } = getPeriodInterval(log.date, metric.scoringFrequency, timeZone, effectiveChallengeStartDate);
        const key = start.toISOString();
        if (!periodsLogs.has(key)) periodsLogs.set(key, []);
        periodsLogs.get(key)!.push(log);
    });

    let totalCumulativePoints = 0;
    const snapshots = [];

    // Iterate through periods
    for (const [periodKey, logsInPeriod] of periodsLogs) {
        const { start, end } = getPeriodInterval(new Date(periodKey), metric.scoringFrequency, timeZone, effectiveChallengeStartDate);

        // Resolve config for this period
        const historicalConfig = getConfigForPeriod(metric.configHistory, start, end);

        const effectivePointsPerUnit = historicalConfig?.pointsPerUnit !== undefined ? historicalConfig.pointsPerUnit : metric.pointsPerUnit;
        const effectiveMaxPerPeriod = historicalConfig?.maxPointsPerPeriod !== undefined ? historicalConfig.maxPointsPerPeriod : metric.maxPointsPerPeriod;
        const effectiveMaxTotal = historicalConfig?.maxPointsTotal !== undefined ? historicalConfig.maxPointsTotal : metric.maxPointsTotal;
        const effectiveRules = historicalConfig?.scoringRules ?? metric.scoringRules;

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

        if (effectivePointsPerUnit !== null && effectivePointsPerUnit !== undefined) {
            // Use Points Per Unit - bypass rules
            // Calculate total units across all logs in period
            let totalUnits = 0;
            qualifierGroups.forEach((val) => {
                totalUnits += val;
            });
            periodRawPoints = totalUnits * effectivePointsPerUnit;
        } else {
            // Apply rules for each qualifier group
            qualifierGroups.forEach((aggregatedVal, qualifierId) => {
                const relevantRules = effectiveRules.filter((rule: any) => rule.qualifierId === qualifierId);

                const rulesToEvaluate = relevantRules.length > 0
                    ? relevantRules
                    : effectiveRules.filter((rule: any) => rule.qualifierId === null);

                rulesToEvaluate.forEach((rule) => {
                    let matches = false;
                    switch (rule.comparisonType) {
                        case "RANGE":
                            matches = aggregatedVal >= (rule.minValue ?? 0) && aggregatedVal <= (rule.maxValue ?? Infinity);
                            break;
                        case "GREATER_THAN":
                            matches = aggregatedVal > (rule.minValue ?? 0);
                            break;
                        case "GREATER_THAN_EQUAL":
                            matches = aggregatedVal >= (rule.minValue ?? 0);
                            break;
                    }

                    if (matches) {
                        periodRawPoints += rule.points;
                    }
                });
            });
        }

        // Apply Period Cap
        let periodCappedPoints = periodRawPoints;
        if (effectiveMaxPerPeriod !== null && effectiveMaxPerPeriod !== undefined) {
            periodCappedPoints = Math.min(periodRawPoints, effectiveMaxPerPeriod);
        }

        totalCumulativePoints += periodCappedPoints;

        // Apply Total Cap
        if (effectiveMaxTotal !== null && effectiveMaxTotal !== undefined) {
            totalCumulativePoints = Math.min(totalCumulativePoints, effectiveMaxTotal);
        }

        snapshots.push({
            userId: participant.userId,
            participantId: participant.id,
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

    return { totalPoints: totalCumulativePoints, snapshots };
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

export async function getChallengeLeaderboard(challengeId: string, startDate?: Date, endDate?: Date) {
    const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId },
        include: {
            metrics: {
                include: {
                    scoringRules: true,
                    qualifiers: true
                }
            },
            participants: {
                include: {
                    user: true,
                    activityLogs: {
                        where: {
                            ...(startDate && endDate ? {
                                date: {
                                    gte: startDate,
                                    lte: endDate
                                }
                            } : {})
                        }
                    }
                }
            }
        }
    });

    if (!challenge) return [];

    const leaderboard = challenge.participants.map(p => {
        let totalScore = 0;
        const metricScores = challenge.metrics.map(m => {
            const logs = p.activityLogs.filter(l => l.metricId === m.id);
            const { totalPoints } = calculateScoreFromLogs(logs, m, p, challenge.timezone, challenge.startDate);
            totalScore += totalPoints;
            return {
                name: m.name,
                score: totalPoints
            };
        });

        return {
            participantId: p.id,
            name: p.displayName || p.name || p.user.name || "Anonymous",
            totalScore,
            metricScores
        };
    });

    return leaderboard.sort((a, b) => b.totalScore - a.totalScore);
}
