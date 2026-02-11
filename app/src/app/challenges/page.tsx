import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { Trophy, Calendar, Users, ChevronRight, Filter } from "lucide-react"
import { syncChallengeStatuses } from "@/app/actions/challenges"
import JoinChallengeModal from "@/app/components/JoinChallengeModal"

export default async function ChallengesExplorePage() {
    const session = await getServerSession(authOptions)

    await syncChallengeStatuses()

    const challenges = await prisma.challenge.findMany({
        where: { isPublic: true },
        include: {
            metrics: true,
            _count: {
                select: { participants: true }
            },
            ...(session ? {
                participants: {
                    where: { userId: session.user.id },
                    select: { id: true }
                }
            } : {})
        },
        orderBy: { startDate: 'desc' }
    })

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                     <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-yellow-500 transition-colors mb-6"
                        >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                        Back to Dashboard
                    </Link>
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Explore Challenges</h1>
                        <p className="text-neutral-400">Join the community and push your limits.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-all">
                            <Filter className="h-4 w-4" />
                            Filter
                        </button>
                    </div>
                </header>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {challenges.map((challenge) => (
                        <div key={challenge.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden hover:border-yellow-500/50 transition-all group flex flex-col shadow-lg">
                            <div className="h-32 bg-gradient-to-br from-neutral-800 to-neutral-900 relative p-6">
                                <div className="absolute -bottom-6 left-6 p-4 bg-neutral-950 rounded-2xl border border-neutral-800 shadow-xl">
                                    <Trophy className="h-8 w-8 text-yellow-500" />
                                </div>
                            </div>

                            <div className="p-6 pt-10 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-500 transition-colors tracking-tight">{challenge.name}</h3>
                                <p className="text-neutral-400 text-sm line-clamp-2 mb-6">{challenge.description}</p>

                                <div className="space-y-3 mb-8 flex-1">
                                    <div className="flex items-center gap-2 text-xs text-neutral-500 font-bold tracking-wider">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(challenge.startDate).toLocaleDateString()} — {new Date(challenge.endDate).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-neutral-500 font-bold tracking-wider">
                                        <Users className="h-4 w-4" />
                                        {challenge._count.participants} Participants
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {challenge.metrics.map(m => (
                                        <span key={m.id} className="text-[10px] font-black bg-neutral-800 text-neutral-400 px-3 py-1 rounded-full border border-neutral-700">
                                            {m.name}
                                        </span>
                                    ))}
                                </div>

                                <div className="space-y-3">
                                    {session && challenge.participants?.length === 0 && (
                                        <JoinChallengeModal
                                            challengeId={challenge.id}
                                            challengeName={challenge.name}
                                        />
                                    )}
                                    {session && challenge.participants?.length > 0 && (
                                        <div className="w-full bg-neutral-800 text-neutral-400 py-3 rounded-2xl font-bold text-center border border-neutral-700">
                                            Joined
                                        </div>
                                    )}
                                    <Link
                                        href={`/challenges/${challenge.id}`}
                                        className="w-full bg-neutral-800 hover:bg-yellow-500 hover:text-neutral-950 transition-all py-3 rounded-2xl font-bold text-center flex items-center justify-center gap-2"
                                    >
                                        View Details
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}

                    {challenges.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <h3 className="text-xl font-bold text-neutral-500">No public challenges found.</h3>
                            <p className="text-neutral-600">Be the first to host one!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
