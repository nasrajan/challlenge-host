import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Trophy, Plus, Settings, Users, LogOut, ChevronRight, Activity, UserCheck, Edit2 } from "lucide-react"
import { prisma } from "@/lib/prisma"
import ActivityLogger from "@/app/components/ActivityLogger"
import { approveParticipant, syncChallengeStatuses } from "@/app/actions/challenges"

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

    await syncChallengeStatuses()

    const challenges = await prisma.challenge.findMany({
        where: {
            OR: [
                { organizerId: session.user.id },
                {
                    participants: {
                        some: {
                            userId: session.user.id,
                            status: "APPROVED"
                        }
                    }
                }
            ]
        },
        include: {
            metrics: {
                include: {
                    qualifiers: true,
                    scoreSnapshots: {
                        where: { userId: session.user.id },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            },
            participants: {
                where: { userId: session.user.id }
            }
        }
    })

    const showApprovals = session.user.role === "ORGANIZER" || session.user.role === "ADMIN"
    const pendingApprovals = showApprovals ? await prisma.participant.findMany({
        where: {
            status: "PENDING",
            ...(session.user.role === "ADMIN" ? {} : { challenge: { organizerId: session.user.id } })
        },
        include: {
            user: true,
            challenge: true
        },
        orderBy: { joinedAt: "desc" }
    }) : []

    // Common UI for all roles, with specific sections rendering conditionally
    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100">
            <nav className="border-b border-neutral-800 bg-neutral-900 px-6 py-4 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    <span className="text-xl font-bold">Challenge.io</span>
                </Link>
                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-sm font-medium">{session.user.name}</span>
                        <span className="text-xs text-neutral-500 font-bold capitalize">{session.user.role.toLowerCase()}</span>
                    </div>
                    <Link href="/api/auth/signout" className="text-neutral-400 hover:text-white transition-colors">
                        <LogOut className="h-5 w-5" />
                    </Link>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-12 max-w-6xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-4xl font-bold mb-2">Dashboard</h2>
                        <p className="text-neutral-400">Track your progress and manage your challenges.</p>
                    </div>

                    {(session.user.role === 'ORGANIZER' || session.user.role === 'ADMIN') && (
                        <Link
                            href="/challenges/create"
                            className="inline-flex items-center gap-2 bg-yellow-500 text-neutral-950 px-6 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/10 active:scale-95"
                        >
                            <Plus className="h-5 w-5" />
                            Create a Challenge
                        </Link>
                    )}
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {showApprovals && pendingApprovals.length > 0 && (
                            <section className="bg-neutral-900/40 border border-neutral-800 rounded-3xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <UserCheck className="h-5 w-5 text-yellow-500" />
                                        Pending Approvals
                                    </h3>
                                    <span className="text-xs font-black tracking-widest text-neutral-500 bg-neutral-950 px-3 py-1 rounded-full border border-neutral-800">
                                        {pendingApprovals.length} pending
                                    </span>
                                </div>
                                <div className="divide-y divide-neutral-800">
                                    {pendingApprovals.map((participant) => (
                                        <div key={participant.id} className="px-6 py-4 flex items-center gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-neutral-200 truncate">{participant.user.name}</div>
                                                <div className="text-xs text-neutral-500 truncate">{participant.user.email}</div>
                                                <div className="text-xs text-neutral-600 mt-1">
                                                    {participant.challenge.name}
                                                </div>
                                            </div>
                                            <form action={approveParticipant.bind(null, participant.id)}>
                                                <button className="bg-yellow-500 text-neutral-950 px-4 py-2 rounded-xl font-bold text-xs hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20">
                                                    Approve
                                                </button>
                                            </form>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-500" />
                                    Active Challenges
                                </h3>
                                <Link href="/challenges" className="text-sm text-neutral-500 hover:text-yellow-500 transition-colors font-medium">
                                    More
                                </Link>
                            </div>

                            {challenges.length === 0 ? (
                                <div className="p-12 rounded-3xl border border-dashed border-neutral-800 bg-neutral-900/40 flex flex-col items-center justify-center text-center">
                                    <Users className="h-12 w-12 text-neutral-700 mb-4" />
                                    <h4 className="text-lg font-bold mb-2">No active Challenge</h4>
                                    <p className="text-neutral-500 max-w-xs mb-6 text-sm">Join a public challenge or create one to start tracking your progress.</p>
                                    <Link href="/challenges" className="bg-neutral-800 text-white px-6 py-2 rounded-xl font-semibold hover:bg-neutral-700 transition-all">
                                        Browse Gallery
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid gap-6">
                                    {challenges.map((challenge) => (
                                        <div key={challenge.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 hover:border-neutral-700 transition-all flex flex-col md:flex-row justify-between gap-6 group">
                                            <div className="space-y-4 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xl font-bold group-hover:text-yellow-500 transition-colors">{challenge.name}</h4>
                                                    <div className="text-xs font-bold text-neutral-500 capitalize bg-neutral-950 px-3 py-1 rounded-full border border-neutral-800">
                                                        {challenge.status.toLowerCase()}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-4">
                                                    {challenge.metrics.map(m => {
                                                        const lastSnapshot = m.scoreSnapshots[0];
                                                        return (
                                                            <div key={m.id} className="bg-neutral-950/50 rounded-2xl p-4 border border-neutral-800/50 min-w-[140px]">
                                                                <div className="text-[10px] font-bold text-neutral-500 mb-1">{m.name}</div>
                                                                <div className="text-lg font-black text-white">
                                                                    {lastSnapshot?.totalPoints || 0}
                                                                    <span className="text-xs text-neutral-500 font-medium ml-1">pts</span>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3 justify-center md:items-end">
                                                {challenge.participants.length > 0 && (
                                                    <ActivityLogger
                                                        challengeId={challenge.id}
                                                        challengeName={challenge.name}
                                                        startDate={challenge.startDate}
                                                        endDate={challenge.endDate}
                                                        metrics={challenge.metrics.map(m => ({
                                                            id: m.id,
                                                            name: m.name,
                                                            unit: m.unit,
                                                            qualifiers: m.qualifiers
                                                        }))}
                                                    />
                                                )}
                                                <div className="flex items-center gap-3">
                                                    {challenge.organizerId === session.user.id && (
                                                        <Link
                                                            href={`/admin/challenges/${challenge.id}/edit`}
                                                            className="text-xs font-bold text-neutral-500 hover:text-yellow-500 flex items-center gap-1 transition-colors px-2"
                                                        >
                                                            <Edit2 className="h-3 w-3" />
                                                            Edit
                                                        </Link>
                                                    )}
                                                    <Link
                                                        href={`/challenges/${challenge.id}`}
                                                        className="text-xs font-bold text-neutral-500 hover:text-white flex items-center gap-1 transition-colors px-2"
                                                    >
                                                        View Details <ChevronRight className="h-3 w-3" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-8">
                        {/* ADMIN role specific controls */}
                        {session.user.role === 'ADMIN' && (
                            <section className="p-8 rounded-3xl border border-red-500/20 bg-red-500/5 group hover:bg-red-500/10 transition-all">
                                <div className="p-3 bg-red-500/10 rounded-xl w-fit mb-6">
                                    <Shield className="h-6 w-6 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-red-500 mb-2">Admin Panel</h3>
                                <p className="text-neutral-400 text-sm mb-6">System-wide user and challenge management.</p>
                                <Link href="/admin" className="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-400 transition-all shadow-lg shadow-red-500/10">
                                    Controller
                                    <Settings className="h-4 w-4" />
                                </Link>
                            </section>
                        )}

                        {/* Stats Summary could go here */}
                    </div>
                </div>
            </main>
        </div>
    )
}

function Shield({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" /></svg>
}
