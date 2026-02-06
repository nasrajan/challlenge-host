'use server'

import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

export async function requestPasswordReset(formData: FormData) {
    const email = formData.get("email") as string

    if (!email) {
        return { error: "Email is required" }
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
        where: { email },
    })

    // Security: Always return success even if user doesn't exist to prevent enumeration
    if (!user) {
        return { success: true, message: "If an account exists, a reset link has been sent." }
    }

    // Generate token
    const token = randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 3600 * 1000) // 1 hour

    // Store token in database
    // Note: We use VerificationToken model which is designed for this
    await prisma.verificationToken.create({
        data: {
            identifier: email,
            token,
            expires,
        },
    })

    // In a real app, send email here using Resend, SendGrid, etc.
    console.log(`[MOCK EMAIL] Password reset link for ${email}: http://localhost:3000/reset-password?token=${token}`)

    return { success: true, message: "If an account exists, a reset link has been sent." }
}
