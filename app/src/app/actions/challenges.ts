'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
    Prisma
} from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { recalculateParticipantChallengeScore, calculateParticipantScoreForMetric } from "@/lib/scoring"
import { parseAsPST } from "@/lib/dateUtils"

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
    const metricsData = JSON.parse(metricsDataJson || "[]")

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
                create: metricsData.map((m: any) => ({
                    name: m.name,
                    unit: m.unit,
                    inputType: m.inputType,
                    aggregationMethod: m.aggregationMethod,
                    scoringFrequency: m.scoringFrequency,
                    maxPointsPerPeriod: m.maxPointsPerPeriod,
                    maxPointsTotal: m.maxPointsTotal,
                    qualifiers: {
                        create: (m.qualifiers || []).map((q: any) => ({
                            value: q.value,
                        }))
                    },
                    scoringRules: {
                        create: (m.scoringRules || []).map((r: any) => ({
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
        await prisma.$transaction(async (tx) => {
            for (const activity of activities) {
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

    const dayStart = new Date(logDate)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayStart.getDate() + 1)

    return prisma.activityLog.findMany({
        where: {
            userId: session.user.id,
            challengeId,
            ...(participantId ? { participantId } : {}),
            date: {
                gte: dayStart,
                lt: dayEnd
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

    const status = challenge.requiresApproval ? "PENDING" : "APPROVED"

    await prisma.$transaction(
        names.map(name =>
            prisma.participant.create({
                data: {
                    userId: session.user.id,
                    challengeId,
                    name: name.trim(),
                    displayName: name.trim(),
                    status: status as any
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
    const startDate = new Date(formData.get("startDate") as string)
    const endDate = new Date(formData.get("endDate") as string)
    const isPublic = formData.get("isPublic") === "true"
    const requiresApproval = formData.get("requiresApproval") === "true"
    const allowMultiParticipants = formData.get("allowMultiParticipants") === "true"
    const showLeaderboard = formData.get("showLeaderboard") === "true"
    const maxParticipants = formData.get("maxParticipants") ? parseInt(formData.get("maxParticipants") as string) : null
    const organizerId = formData.get("organizerId") as string | null

    const metricsDataJson = formData.get("metricsData") as string
    const metricsData = JSON.parse(metricsDataJson || "[]")

    try {
        await prisma.$transaction(async (tx) => {
            const existing = await tx.challenge.findUnique({
                where: { id: challengeId },
                include: { metrics: true }
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
            const incomingMetricIds = new Set(metricsData.map((m: any) => m.id))

            // 1. Delete removed metrics
            const metricsToDelete = existing.metrics.filter(m => !incomingMetricIds.has(m.id))
            for (const metric of metricsToDelete) {
                // This might fail if activities exist, which is expected behavior (constraints)
                // We could wrap in try/catch to ignore or warn, but letting it fail prevents accidental data loss
                await tx.challengeMetric.delete({ where: { id: metric.id } })
            }

            // 2. Update existing or Create new metrics
            for (const m of metricsData) {
                if (existingMetricIds.has(m.id)) {
                    // UPDATE existing metric
                    await tx.challengeMetric.update({
                        where: { id: m.id },
                        data: {
                            name: m.name,
                            unit: m.unit,
                            inputType: m.inputType,
                            aggregationMethod: m.aggregationMethod,
                            scoringFrequency: m.scoringFrequency,
                            maxPointsPerPeriod: m.maxPointsPerPeriod,
                            maxPointsTotal: m.maxPointsTotal,
                        }
                    })

                    // Refresh scoring rules (delete all and recreate)
                    // We assume scoring rules don't have external FK dependencies preventing delete
                    await tx.scoringRule.deleteMany({
                        where: { metricId: m.id }
                    })

                    if (m.scoringRules && m.scoringRules.length > 0) {
                        await tx.scoringRule.createMany({
                            data: m.scoringRules.map((r: any) => ({
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
                            unit: m.unit,
                            inputType: m.inputType,
                            aggregationMethod: m.aggregationMethod,
                            scoringFrequency: m.scoringFrequency,
                            maxPointsPerPeriod: m.maxPointsPerPeriod,
                            maxPointsTotal: m.maxPointsTotal,
                            qualifiers: {
                                create: (m.qualifiers || []).map((q: any) => ({
                                    value: q.value,
                                }))
                            },
                            scoringRules: {
                                create: (m.scoringRules || []).map((r: any) => ({
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
