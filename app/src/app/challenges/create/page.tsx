import { Trophy } from "lucide-react"
import ChallengeForm from "@/app/components/Admin/ChallengeForm"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CreateChallengePage() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER")) {
        redirect("/challenges")
    }

    const organizers = await prisma.user.findMany({
        where: {
            role: { in: ['ADMIN', 'ORGANIZER'] }
        },
        select: {
            id: true,
            name: true,
            email: true
        }
    })

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 border-b border-neutral-800 pb-8">
                    <h1 className="text-4xl font-bold flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/10 rounded-2xl">
                            <Trophy className="h-10 w-10 text-yellow-500" />
                        </div>
                        Create Your Challenge
                    </h1>
                    <p className="text-neutral-400 mt-4 text-lg">Create a robust scoring system with multiple tasks, rules, and caps.</p>
                </header>

                <ChallengeForm
                    mode="CREATE"
                    organizers={organizers}
                    currentUserRole={session.user.role}
                />
            </div>
        </div>
    )
}
