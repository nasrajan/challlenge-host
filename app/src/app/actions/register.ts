'use server'

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
})

export async function registerUser(formData: FormData) {
    try {
        const name = formData.get("name")
        const email = formData.get("email")
        const password = formData.get("password")

        const validatedFields = registerSchema.safeParse({
            name,
            email,
            password,
        })

        if (!validatedFields.success) {
            const errorMessages = validatedFields.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join(", ")
            return { error: `Validation error: ${errorMessages}` }
        }

        const { email: validatedEmail, password: validatedPassword, name: validatedName } = validatedFields.data

        const existingUser = await prisma.user.findUnique({
            where: {
                email: validatedEmail,
            },
        })

        if (existingUser) {
            return { error: "Email already exists" }
        }

        const hashedPassword = await bcrypt.hash(validatedPassword, 10)

        await prisma.user.create({
            data: {
                name: validatedName,
                email: validatedEmail,
                password: hashedPassword,
            },
        })

        return { success: true }
    } catch (error) {
        console.error("Registration error:", error)
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Something went wrong" }
    }
}
