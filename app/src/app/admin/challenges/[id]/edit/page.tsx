import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Edit2, ChevronLeft } from "lucide-react"
import Link from "next/link"
import ChallengeForm from "@/app/components/Admin/ChallengeForm"

export default async function EditChallengePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER")) {
        redirect("/challenges")
    }

    const { id: challengeId } = await params

    const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId },
        include: {
            metrics: {
                include: {
                    qualifiers: true,
                    scoringRules: true
                }
            }
        }
    })

    if (!challenge) {
        notFound()
    }

    // Per user request: editing for UPCOMING challenges
    // If we want to strictly enforce this:
    if (challenge.status !== 'UPCOMING') {
        // You could either prevent edit or show a warning. 
        // For now let's allow admins to edit but prioritize the 'UPCOMING' flow.
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 border-b border-neutral-800 pb-8">
                    <Link href="/admin/challenges" className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors w-fit mb-6 italic font-mono text-sm">
                        <ChevronLeft className="h-4 w-4" />
                        Abort Edit / Back to Pool
                    </Link>
                    <h1 className="text-4xl font-bold flex items-center gap-4 italic uppercase tracking-tighter">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <Edit2 className="h-10 w-10 text-blue-500" />
                        </div>
                        Modify Mission Parameters
                    </h1>
                    <p className="text-neutral-400 mt-4 text-lg">Adjust the core scoring logic and mission window for <span className="text-blue-400 font-bold">"{challenge.name}"</span>.</p>
                </header>

                <ChallengeForm
                    mode="EDIT"
                    initialData={{
                        id: challenge.id,
                        name: challenge.name,
                        description: challenge.description,
                        startDate: challenge.startDate,
                        endDate: challenge.endDate,
                        isPublic: challenge.isPublic,
                        requiresApproval: challenge.requiresApproval,
                        showLeaderboard: challenge.showLeaderboard,
                        maxParticipants: challenge.maxParticipants,
                        metrics: challenge.metrics
                    }}
                />
            </div>
        </div>
    )
}
