'use server'

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function resetPassword(formData: FormData) {
    const token = formData.get("token") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!token || !password || !confirmPassword) {
        return { error: "All fields are required" }
    }

    if (password !== confirmPassword) {
        return { error: "Passwords do not match" }
    }

    if (password.length < 6) {
        return { error: "Password must be at least 6 characters" }
    }

    // Verify token
    const verificationToken = await prisma.verificationToken.findUnique({
        where: { token },
    })

    if (!verificationToken) {
        return { error: "Invalid or expired token" }
    }

    if (new Date() > verificationToken.expires) {
        return { error: "Token has expired" }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user password
    await prisma.user.update({
        where: { email: verificationToken.identifier },
        data: { password: hashedPassword },
    })

    // Delete used token
    await prisma.verificationToken.delete({
        where: { token },
    })

    return { success: true }
}
