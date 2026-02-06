'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ChallengeStatus, AggregationMethod } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createChallenge(formData: FormData) {
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
    const showLeaderboard = formData.get("showLeaderboard") === "true"
    const maxParticipants = formData.get("maxParticipants") ? parseInt(formData.get("maxParticipants") as string) : null

    const metric = formData.get("metric") as string
    const unit = formData.get("unit") as string
    const aggregation = formData.get("aggregation") as AggregationMethod
    const frequency = formData.get("frequency") as string

    try {
        const challenge = await prisma.challenge.create({
            data: {
                name,
                description,
                startDate,
                endDate,
                isPublic,
                requiresApproval,
                showLeaderboard,
                maxParticipants,
                metric,
                unit,
                aggregation,
                frequency,
                organizerId: session.user.id,
                status: "UPCOMING",
            }
        })

        revalidatePath("/dashboard")
        revalidatePath("/challenges")
        return { success: true, challengeId: challenge.id }
    } catch (error) {
        console.error("Failed to create challenge:", error)
        return { error: "Failed to create challenge" }
    }
}

export async function joinChallenge(challengeId: string) {
    const session = await getServerSession(authOptions)
    if (!session) throw new Error("Unauthorized")

    const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId }
    })

    if (!challenge) throw new Error("Challenge not found")

    const status = challenge.requiresApproval ? "PENDING" : "APPROVED"

    await prisma.participant.create({
        data: {
            userId: session.user.id,
            challengeId,
            status: status as any
        }
    })

    revalidatePath(`/challenges/${challengeId}`)
    revalidatePath("/dashboard")
}
