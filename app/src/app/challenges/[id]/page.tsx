import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { notFound } from "next/navigation"

import {
    Trophy,
    Calendar,
    Users,
    BarChart,
    CheckCircle2,
    User as UserIcon,
    Crown,
    LayoutDashboard,
} from "lucide-react"
import JoinChallengeModal from "@/app/components/JoinChallengeModal"
import ActivityLogger from "@/app/components/ActivityLogger"
import DateDisplay from "@/app/components/DateDisplay"

import ExpandableDescription from "@/app/components/ExpandableDescription"

export default async function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    const { id: challengeId } = await params

    const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId },
        include: {
            metrics: {
                include: {
                    scoringRules: true,
                    qualifiers: true
                }
            },
            participants: {
                include: {
                    user: true,
                    scoreSnapshots: {
                        where: { challengeId },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            },
            _count: {
                select: { participants: true }
            }
        }
    })

    if (!challenge) notFound()

    const isParticipant = !!challenge.participants.find(p => p.userId === session?.user?.id)

    // Calculate Leaderboard
    // We need to aggregate total points per participant across all metrics for this challenge
    const leaderboard = challenge.participants
        .map(p => {
            // Get the latest snapshot for each metric for this participant
            const participantMetricsScores = challenge.metrics.map(m => {
                const latestSnapshot = p.scoreSnapshots.find(s => s.metricId === m.id)
                return latestSnapshot?.totalPoints || 0
            })

            const totalScore = participantMetricsScores.reduce((a, b) => a + b, 0)

            // Get display name from the participant, fallback to most recent snapshot, then user name
            const latestSnapshot = p.scoreSnapshots[0]
            const displayName = p.displayName || latestSnapshot?.displayName || p.user.name || "Anonymous"

            return {
                participantId: p.id,
                name: displayName,
                totalScore,
                metricScores: challenge.metrics.map((m, i) => ({
                    name: m.name,
                    score: participantMetricsScores[i]
                }))
            }
        })
        .sort((a, b) => b.totalScore - a.totalScore)

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100">
            {/* Hero Section */}
            <div className="bg-neutral-900 border-b border-neutral-800 relative overflow-hidden mb-3 sm:mb-5">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent pointer-events-none" />
                <Link href="/dashboard" className="flex mt-2 items-center gap-2">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    <span className="text-xl font-bold">Challenge.io</span>
                </Link>
                <div className="container mx-auto px-6 py-6 sm:py-6 relative">

                    <div className="max-w-6xl mx-auto">

                        <h2 className="text-4xl font-black mb-6 tracking-tight">{challenge.name}</h2>
                        <ExpandableDescription
                            title={challenge.name}
                            description={challenge.description || ""}
                        />

                        <div className="flex flex-wrap gap-8 items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-800 rounded-lg">
                                    <Calendar className="h-5 w-5 text-neutral-400" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-neutral-500">Duration</div>
                                    <div className="text-sm font-bold flex items-center gap-1">
                                        <DateDisplay date={challenge.startDate} /> — <DateDisplay date={challenge.endDate} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neutral-800 rounded-lg">
                                    <Users className="h-5 w-5 text-neutral-400" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-neutral-500">Participants</div>
                                    <div className="text-sm font-bold">{challenge._count.participants} Joined</div>
                                </div>
                            </div>

                            {isParticipant && (
                                <ActivityLogger
                                    challengeId={challenge.id}
                                    challengeName={challenge.name}
                                    startDate={challenge.startDate}
                                    endDate={challenge.endDate}
                                    participants={challenge.participants
                                        .filter(p => p.userId === session?.user?.id)
                                        .map(p => ({
                                            id: p.id,
                                            userId: p.userId,
                                            challengeId: p.challengeId,
                                            name: p.name,
                                            displayName: p.displayName,
                                            joinedAt: p.joinedAt,
                                            status: p.status
                                        }))}
                                    metrics={challenge.metrics.map(m => ({
                                        id: m.id,
                                        name: m.name,
                                        unit: m.unit,
                                        qualifiers: m.qualifiers || [],
                                        inputType: m.inputType
                                    }))}
                                />
                            )}

                            {session && !isParticipant && (
                                <JoinChallengeModal
                                    challengeId={challenge.id}
                                    challengeName={challenge.name}
                                    allowMultiParticipants={challenge.allowMultiParticipants}
                                />
                            )}
                        </div>
                    </div >
                </div >
            </div >

            <main className="container mx-auto px-3 py-16 max-w-6xl grid lg:grid-cols-3 gap-16">
                {/* Left Column: Metrics & Rules */}
                <div className="lg:col-span-1 space-y-12">
                    <section>
                        <h2 className="text-sm font-bold text-neutral-500 mb-8 border-l-2 border-yellow-500 pl-4">Scoring Infrastructure</h2>
                        <div className=" space-y-6">
                            {challenge.metrics.map(m => (
                                <div key={m.id} className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-3 hover:bg-neutral-900 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-bold text-white">{m.name}</h4>
                                        <span className="text-[10px] font-black text-neutral-500 bg-neutral-950 px-3 py-1 rounded-full border border-neutral-800">{m.unit}</span>
                                    </div>
                                    <div className="space-y-3">
                                        {m.scoringRules.map(rule => (
                                            <div key={rule.id} className="flex items-center gap-3 text-sm">
                                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                                <span className="text-neutral-300">
                                                    {rule.comparisonType === 'RANGE' ? `${rule.minValue} to ${rule.maxValue}` : `≥ ${rule.minValue}`} {m.unit}
                                                </span>
                                                <span className="ml-2 font-black text-yellow-500">+{rule.points} pts</span>
                                            </div>
                                        ))}
                                        <div className="pt-3 border-t border-neutral-800 mt-2 flex items-center justify-between">
                                            <div className="text-[10px] font-bold text-neutral-700">Aggregation</div>
                                            <div className="text-xs font-bold text-neutral-400">{m.aggregationMethod} / {m.scoringFrequency}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>

                {/* Right Column: Leaderboard */}
                {challenge.showLeaderboard && (<div className="lg:col-span-2 space-y-8">
                    <section className="bg-neutral-900/40 border border-neutral-800 rounded-3xl overflow-hidden">
                        <div className="px-8 py-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
                            <h2 className="text-xl font-bold flex items-center gap-3">
                                <BarChart className="h-6 w-6 text-yellow-500" />
                                Leaderboard
                            </h2>
                        </div>

                        <div className="divide-y divide-neutral-800">
                            {leaderboard.map((user, index) => (
                                <div
                                    key={user.name}
                                    className={`px-4 sm:px-8 py-4 sm:py-6 flex items-center gap-3 sm:gap-6 transition-colors group hover:bg-neutral-900/40 ${index < 3 ? "bg-yellow-500/5" : ""
                                        }`}
                                >
                                    <div className="w-8 sm:w-10 text-center font-black text-neutral-700 text-lg sm:text-xl italic group-hover:text-yellow-500 transition-colors">
                                        #{index + 1}
                                    </div>

                                    <div className="relative shrink-0">
                                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-neutral-800 flex items-center justify-center border border-neutral-700">
                                            {index === 0 ? (
                                                <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                                            ) : (
                                                <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-neutral-500" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-base sm:text-lg break-words sm:break-normal sm:truncate max-w-[14rem] sm:max-w-none">
                                            <span className="sm:hidden">
                                                {user.name?.split(" ").slice(0, 2).join(" ") || "Anonymous"}
                                            </span>
                                            <span className="hidden sm:inline">
                                                {user.name || "Anonymous"}
                                            </span>
                                        </h4>

                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 min-w-0">
                                            {user.metricScores.map(ms => (
                                                <div key={ms.name} className="text-[10px] font-bold text-neutral-500 break-words">
                                                    {ms.name}: <span className="text-neutral-300">{ms.score}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="text-xl sm:text-2xl font-black text-white">{user.totalScore}</div>
                                        <div className="text-[10px] font-bold text-neutral-500">Total Pts</div>
                                    </div>
                                </div>

                            ))}

                            {leaderboard.length === 0 && (
                                <div className="p-20 text-center text-neutral-500 flex flex-col items-center">
                                    <Activity className="h-12 w-12 text-neutral-800 mb-4" />
                                    <p>No activity recorded yet for this challenge.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>)}
            </main>
        </div >
    )
}

function LinkIcon({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
}

function Activity({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
}
