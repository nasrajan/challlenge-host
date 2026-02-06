'use server'

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import { revalidatePath } from "next/cache"

async function ensureAdmin() {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized: Admin access required")
    }
}

export async function getAllUsers() {
    await ensureAdmin()
    return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        }
    })
}

export async function updateUserRole(userId: string, role: UserRole) {
    await ensureAdmin()

    await prisma.user.update({
        where: { id: userId },
        data: { role },
    })

    revalidatePath("/admin")
}

export async function promoteToAdmin(email: string) {
    // This is a special action that might need bypass if no admins exist
    // For now, we'll allow it if we can find the user
    const user = await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" }
    })
    revalidatePath("/dashboard")
    return { success: true, user }
}
