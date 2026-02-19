'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
    AggregationMethod,
    ComparisonType,
    MetricInputType,
    ParticipantStatus,
    Prisma,
    ScoringFrequency
} from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { recalculateParticipantChallengeScore, calculateParticipantScoreForMetric, getPeriodInterval } from "@/lib/scoring"
import { parseAsPST } from "@/lib/dateUtils"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { buildSnapshotFromMetric, hasConfigChanged } from "@/lib/metricConfig"

interface MetricPayloadQualifier {
    value: string
}

interface MetricPayloadRule {
    comparisonType: ComparisonType
    minValue: number | null
    maxValue: number | null
    points: number
}

interface MetricPayload {
    id: string
    name: string
    description: string | null | undefined
    unit: string
    inputType: MetricInputType
    aggregationMethod: AggregationMethod
    scoringFrequency: ScoringFrequency
    maxPointsPerPeriod: number | null
    maxPointsTotal: number | null
    pointsPerUnit: number | null
    qualifiers?: MetricPayloadQualifier[]
    scoringRules?: MetricPayloadRule[]
    configHistory?: any // Added for versioning
}

export async function syncChallengeStatuses(now: Date = new Date()) {
    await prisma.$transaction([
        prisma.challenge.updateMany({
            where: {
                startDate: { lte: now },
                endDate: { gte: now },
                status: { not: "ACTIVE" }
            },
            data: { status: "ACTIVE" }
        }),
        prisma.challenge.updateMany({
            where: {
                startDate: { gt: now },
                status: { not: "UPCOMING" }
            },
            data: { status: "UPCOMING" }
        }),
        prisma.challenge.updateMany({
            where: {
                endDate: { lt: now },
                status: { not: "COMPLETED" }
            },
            data: { status: "COMPLETED" }
        })
    ])
}

export async function approveParticipant(participantId: string) {
    const session = await getServerSession(authOptions)
    if (!session) throw new Error("Unauthorized")

    const participant = await prisma.participant.findUnique({
        where: { id: participantId },
        include: { challenge: true }
    })

    if (!participant) throw new Error("Participant not found")

    const isAdmin = session.user.role === "ADMIN"
    const isOrganizer = session.user.role === "ORGANIZER" && participant.challenge.organizerId === session.user.id
    if (!isAdmin && !isOrganizer) throw new Error("Unauthorized")

    await prisma.participant.update({
        where: { id: participantId },
        data: { status: "APPROVED" }
    })

    revalidatePath("/dashboard")
    revalidatePath("/admin/challenges")
    revalidatePath(`/challenges/${participant.challengeId}`)
}

export async function createChallenge(formData: FormData) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized")
    }

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const startDate = parseAsPST(formData.get("startDate") as string)
    const endDate = parseAsPST(formData.get("endDate") as string)
    const isPublic = formData.get("isPublic") === "true"
    const requiresApproval = formData.get("requiresApproval") === "true"
    const allowMultiParticipants = formData.get("allowMultiParticipants") === "true"
    const showLeaderboard = formData.get("showLeaderboard") === "true"
    const maxParticipants = formData.get("maxParticipants") ? parseInt(formData.get("maxParticipants") as string) : null
    const organizerId = formData.get("organizerId") as string | null

    const metricsDataJson = formData.get("metricsData") as string
    const metricsData = JSON.parse(metricsDataJson || "[]") as MetricPayload[]

    try {
        const challengeData: Prisma.ChallengeCreateInput = {
            name,
            description,
            startDate,
            endDate,
            isPublic,
            requiresApproval,
            allowMultiParticipants,
            showLeaderboard,
            maxParticipants,
            organizer: { connect: { id: (session.user.role === 'ADMIN' && organizerId) ? organizerId : session.user.id } },
            status: "UPCOMING",
            metrics: {
                create: metricsData.map((m) => ({
                    name: m.name,
                    description: m.description,
                    unit: m.unit,
                    inputType: m.inputType,
                    aggregationMethod: m.aggregationMethod,
                    scoringFrequency: m.scoringFrequency,
                    maxPointsPerPeriod: m.maxPointsPerPeriod,
                    maxPointsTotal: m.maxPointsTotal,
                    pointsPerUnit: m.pointsPerUnit,
                    qualifiers: {
                        create: (m.qualifiers || []).map((q) => ({
                            value: q.value,
                        }))
                    },
                    scoringRules: {
                        create: (m.scoringRules || []).map((r) => ({
                            comparisonType: r.comparisonType,
                            minValue: r.minValue,
                            maxValue: r.maxValue,
                            points: r.points,
                        }))
                    }
                }))
            }
        }

        const challenge = await prisma.challenge.create({
            data: challengeData
        })

        revalidatePath("/dashboard")
        revalidatePath("/challenges")
        return { success: true, challengeId: challenge.id }
    } catch (error) {
        console.error("Failed to create challenge:", error)
        return { error: "Failed to create challenge" }
    }
}

export async function logActivities(data: {
    challengeId: string;
    participantId: string;
    logDate: string;
    notes: string;
    activities: { metricId: string; value: number; notes?: string }[];
}) {
    const session = await getServerSession(authOptions)
    if (!session) throw new Error("Unauthorized")

    const { challengeId, participantId, logDate, notes, activities } = data;
    const date = parseAsPST(logDate);

    try {
        const participant = await prisma.participant.findUnique({
            where: { id: participantId },
            select: { status: true, userId: true }
        });

        if (!participant) {
            return { error: "Participant not found" };
        }

        if (participant.status !== "APPROVED") {
            return { error: "You must be an approved participant to log activities." };
        }

        if (participant.userId !== session.user.id && session.user.role !== "ADMIN") {
            return { error: "Unauthorized" };
        }

        await prisma.$transaction(async (tx) => {
            for (const activity of activities) {
                // Delete existing logs for this metric on this day for this participant
                // to ensure the new log replaces the "daily total" shown in the UI.
                await tx.activityLog.deleteMany({
                    where: {
                        participantId,
                        metricId: activity.metricId,
                        date: {
                            gte: startOfDay(date),
                            lte: endOfDay(date)
                        }
                    }
                });

                await tx.activityLog.create({
                    data: {
                        userId: session.user.id,
                        participantId,
                        challengeId,
                        metricId: activity.metricId,
                        value: activity.value,
                        date,
                        notes: activity.notes || notes
                    }
                });
            }
        });

        // Recalculate scores after logs are created
        for (const activity of activities) {
            await calculateParticipantScoreForMetric(participantId, activity.metricId);
        }

        revalidatePath(`/challenges/${challengeId}`)
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Failed to log activities:", error)
        return { error: "Failed to log activities" }
    }
}

export async function getActivityLogsForDate(challengeId: string, logDate: string, participantId?: string) {
    const session = await getServerSession(authOptions)
    if (!session) throw new Error("Unauthorized")

    const date = parseAsPST(logDate)
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)

    return prisma.activityLog.findMany({
        where: {
            userId: session.user.id,
            challengeId,
            ...(participantId ? { participantId } : {}),
            date: {
                gte: dayStart,
                lte: dayEnd
            }
        },
        select: {
            metricId: true,
            value: true,
            notes: true
        }
    })
}

/*export async function logActivity(formData: FormData) {
    const session = await getServerSession(authOptions)
    if (!session) throw new Error("Unauthorized")

    const challengeId = formData.get("challengeId") as string
    const metricId = formData.get("metricId") as string
    const value = parseFloat(formData.get("value") as string)
    const date = new Date(formData.get("logDate") as string || new Date())
    const notes = formData.get("notes") as string

    return logActivities({
        challengeId,
        logDate: date.toISOString(),
        notes,
        activities: [{ metricId, value }]
    });
}*/

export async function joinChallenge(challengeId: string, names: string[]) {
    const session = await getServerSession(authOptions)
    if (!session) throw new Error("Unauthorized")

    if (!names || names.length === 0) {
        throw new Error("At least one participant name is required")
    }

    const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId }
    })

    if (!challenge) throw new Error("Challenge not found")

    const status: ParticipantStatus = challenge.requiresApproval ? "PENDING" : "APPROVED"

    await prisma.$transaction(
        names.map(name =>
            prisma.participant.create({
                data: {
                    userId: session.user.id,
                    challengeId,
                    name: name.trim(),
                    displayName: name.trim(),
                    status
                }
            })
        )
    )

    revalidatePath(`/challenges/${challengeId}`)
    revalidatePath("/dashboard")
}

export async function updateChallenge(challengeId: string, formData: FormData) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized")
    }

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const startDateRaw = formData.get("startDate") as string
    const endDateRaw = formData.get("endDate") as string
    const isPublic = formData.get("isPublic") === "true"
    const requiresApproval = formData.get("requiresApproval") === "true"
    const allowMultiParticipants = formData.get("allowMultiParticipants") === "true"
    const showLeaderboard = formData.get("showLeaderboard") === "true"
    const maxParticipants = formData.get("maxParticipants") ? parseInt(formData.get("maxParticipants") as string) : null
    const organizerId = formData.get("organizerId") as string

    const metricsDataJson = formData.get("metricsData") as string
    const metricsData = JSON.parse(metricsDataJson || "[]") as MetricPayload[]

    // Parse dates
    const startDate = parseAsPST(startDateRaw)
    const endDate = parseAsPST(endDateRaw)

    try {
        await prisma.$transaction(async (tx) => {
            const existing = await tx.challenge.findUnique({
                where: { id: challengeId },
                include: {
                    metrics: {
                        include: {
                            scoringRules: true
                        }
                    }
                }
            })

            if (!existing) throw new Error("Challenge not found")

            // Update main challenge details
            await tx.challenge.update({
                where: { id: challengeId },
                data: {
                    name,
                    description,
                    startDate,
                    endDate,
                    isPublic,
                    requiresApproval,
                    allowMultiParticipants,
                    showLeaderboard,
                    maxParticipants,
                    ...(session.user.role === 'ADMIN' && organizerId ? { organizerId } : {})
                }
            })

            // Handle Key Metrics
            const existingMetricIds = new Set(existing.metrics.map(m => m.id))
            const incomingMetricIds = new Set(metricsData.map((m) => m.id))

            // 1. Delete removed metrics
            const metricsToDelete = existing.metrics.filter(m => !incomingMetricIds.has(m.id))
            for (const metric of metricsToDelete) {
                await tx.challengeMetric.delete({ where: { id: metric.id } })
            }

            // 2. Update existing or Create new metrics
            for (const m of metricsData) {
                if (existingMetricIds.has(m.id)) {
                    // UPDATE existing metric
                    const existingMetric = existing.metrics.find(em => em.id === m.id)!

                    const oldSnapshot = buildSnapshotFromMetric(existingMetric as any)
                    const newSnapshot = buildSnapshotFromMetric({
                        ...m,
                        description: m.description ?? null,
                        scoringRules: m.scoringRules ?? []
                    } as any)

                    let updatedConfigHistory = (existingMetric as any).configHistory

                    if (hasConfigChanged(oldSnapshot, newSnapshot)) {
                        // Config changed, archive the old one
                        const { end: periodEnd } = getPeriodInterval(
                            new Date(),
                            existingMetric.scoringFrequency,
                            existing.timezone
                        )

                        const history = Array.isArray((existingMetric as any).configHistory)
                            ? [...((existingMetric as any).configHistory as any[])]
                            : []

                        // Find if there's an existing history entry covering from the end of last entry
                        const lastEntry = history.length > 0 ? history[history.length - 1] : null
                        const effectiveFrom = lastEntry ? lastEntry.effectiveTo : null

                        history.push({
                            ...oldSnapshot,
                            effectiveFrom,
                            effectiveTo: periodEnd.toISOString()
                        })
                        updatedConfigHistory = history
                    }

                    await tx.challengeMetric.update({
                        where: { id: m.id },
                        data: {
                            name: m.name,
                            description: m.description,
                            unit: m.unit,
                            inputType: m.inputType,
                            aggregationMethod: m.aggregationMethod,
                            scoringFrequency: m.scoringFrequency,
                            maxPointsPerPeriod: m.maxPointsPerPeriod,
                            maxPointsTotal: m.maxPointsTotal,
                            pointsPerUnit: m.pointsPerUnit,
                            configHistory: (updatedConfigHistory as Prisma.InputJsonValue) ?? []
                        }
                    })

                    // Refresh scoring rules (delete all and recreate)
                    await tx.scoringRule.deleteMany({
                        where: { metricId: m.id }
                    })

                    if (m.scoringRules && m.scoringRules.length > 0) {
                        await tx.scoringRule.createMany({
                            data: m.scoringRules.map((r) => ({
                                metricId: m.id,
                                comparisonType: r.comparisonType,
                                minValue: r.minValue,
                                maxValue: r.maxValue,
                                points: r.points
                            }))
                        })
                    }

                    // Note: We are deliberately NOT updating qualifiers here to avoid breaking ActivityLogs
                    // If qualifier editing is needed, it requires a more complex diffing strategy
                } else {
                    // CREATE new metric
                    // Remove temporary client-side ID to let Prisma generate a real CUID
                    // OR if m.id is needed for referential integrity in UI, we can use it if it's not a collision
                    // But 'ChallengeMetric' ID is a CUID. Client random string might not be valid CUID or optimal.
                    // Better to let Prisma generate new ID.

                    await tx.challengeMetric.create({
                        data: {
                            challengeId: challengeId,
                            name: m.name,
                            description: m.description,
                            unit: m.unit,
                            inputType: m.inputType,
                            aggregationMethod: m.aggregationMethod,
                            scoringFrequency: m.scoringFrequency,
                            maxPointsPerPeriod: m.maxPointsPerPeriod,
                            maxPointsTotal: m.maxPointsTotal,
                            pointsPerUnit: m.pointsPerUnit,
                            qualifiers: {
                                create: (m.qualifiers || []).map((q) => ({
                                    value: q.value,
                                }))
                            },
                            scoringRules: {
                                create: (m.scoringRules || []).map((r) => ({
                                    comparisonType: r.comparisonType,
                                    minValue: r.minValue,
                                    maxValue: r.maxValue,
                                    points: r.points,
                                }))
                            }
                        }
                    })
                }
            }
        })

        revalidatePath("/admin/challenges")
        revalidatePath(`/challenges/${challengeId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to update challenge:", error)
        return { error: "Failed to update challenge. Some changes could not be saved due to existing participant data." }
    }
}

export async function deleteChallenge(challengeId: string) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized")
    }

    try {
        await prisma.challenge.delete({
            where: { id: challengeId }
        })
        revalidatePath("/admin/challenges")
        revalidatePath("/challenges")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete challenge:", error)
        return { error: "Failed to delete challenge" }
    }
}

export async function getMetricPeriodStats(data: {
    participantId: string;
    challengeId: string;
    metricId: string;
    logDate: string;
    frequency: ScoringFrequency;
    aggregationMethod: AggregationMethod;
    challengeStartDate: string;
    timeZone: string;
}) {
    const session = await getServerSession(authOptions)
    if (!session) throw new Error("Unauthorized")

    const { participantId, challengeId, metricId, logDate, frequency, challengeStartDate, timeZone } = data;
    const date = parseAsPST(logDate);
    const startDate = new Date(challengeStartDate);

    const { start: periodStart, end: periodEnd } = getPeriodInterval(date, frequency, timeZone, startDate);

    const logs = await prisma.activityLog.findMany({
        where: {
            participantId,
            challengeId,
            metricId,
            date: {
                gte: periodStart,
                lte: periodEnd
            }
        }
    });

    // Simple SUM for capping logic as per user requirement (max points for the period)
    const totalValue = logs.reduce((sum, log) => sum + log.value, 0);

    return { totalValue, periodStart, periodEnd };
}
