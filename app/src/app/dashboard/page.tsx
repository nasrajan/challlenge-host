import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Trophy, Plus, Settings, Users, LogOut, ChevronRight, Activity, UserCheck, Edit2 } from "lucide-react"
import type {
    AggregationMethod,
    ComparisonType,
    MetricInputType,
    Prisma,
    ParticipantStatus,
    ScoringFrequency
} from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { approveParticipant, syncChallengeStatuses } from "@/app/actions/challenges"
import { addDays, endOfDay, format } from "date-fns"
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz"
import { calculateScoreFromLogs } from "@/lib/scoring"
import { isMidnightUTC } from "@/lib/dateUtils"

import ActivityLogger from "@/app/components/ActivityLoggerClient"

type ScoreLogsArg = Parameters<typeof calculateScoreFromLogs>[0]
type ScoreMetricArg = Parameters<typeof calculateScoreFromLogs>[1]
type ScoreParticipantArg = Parameters<typeof calculateScoreFromLogs>[2]

interface DashboardQualifier {
    id: string
    value: string
}

interface DashboardScoringRule {
    id: string
    qualifierId: string | null
    comparisonType: ComparisonType
    minValue: number | null
    maxValue: number | null
    points: number
}

interface DashboardActivityLog {
    date: Date
    value: number
    qualifierId: string | null
    createdAt: Date
    participantId: string | null
}

interface DashboardScoreSnapshot {
    totalPoints: number
    participantId: string | null
    periodStart: Date
}

interface DashboardMetric {
    id: string
    name: string
    description: string | null
    unit: string
    inputType: MetricInputType
    aggregationMethod: AggregationMethod
    scoringFrequency: ScoringFrequency
    challengeId: string
    pointsPerUnit: number | null
    maxPointsPerPeriod: number | null
    maxPointsTotal: number | null
    qualifiers: DashboardQualifier[]
    scoringRules: DashboardScoringRule[]
    activityLogs: DashboardActivityLog[]
    scoreSnapshots: DashboardScoreSnapshot[]
}

interface DashboardParticipant {
    id: string
    userId: string
    challengeId: string
    name: string
    displayName: string | null
    joinedAt: Date
    status: ParticipantStatus
}

interface DashboardChallenge {
    id: string
    name: string
    status: string
    organizerId: string
    startDate: Date
    endDate: Date
    timezone: string | null
    metrics: DashboardMetric[]
    participants: DashboardParticipant[]
}

interface DashboardItem {
    challenge: DashboardChallenge
    participant: DashboardParticipant | null
    key: string
}

function getCurrentChallengeWeekWindow(
    startDate: Date,
    endDate: Date,
    timeZone: string,
    now: Date = new Date(),
    useLocalCalendarDateForCurrentWeek: boolean = false
) {
    const zonedNow = toZonedTime(now, timeZone)
    let currentStart = toZonedTime(startDate, timeZone)
    const zonedEndDate = toZonedTime(endDate, timeZone)

    let fallbackWeek = {
        weekStartUtc: fromZonedTime(currentStart, timeZone),
        weekEndUtc: fromZonedTime(endOfDay(addDays(currentStart, 6)), timeZone),
        rangeLabel: `${format(currentStart, 'MMM d')} - ${format(endOfDay(addDays(currentStart, 6)), 'MMM d')}`
    }

    while (currentStart < zonedEndDate) {
        let currentEnd = endOfDay(addDays(currentStart, 6))
        if (currentEnd > endOfDay(zonedEndDate)) {
            currentEnd = endOfDay(zonedEndDate)
        }

        const currentWeek = {
            weekStartUtc: fromZonedTime(currentStart, timeZone),
            weekEndUtc: fromZonedTime(currentEnd, timeZone),
            rangeLabel: `${format(currentStart, 'MMM d')} - ${format(currentEnd, 'MMM d')}`
        }

        fallbackWeek = currentWeek

        if (useLocalCalendarDateForCurrentWeek) {
            const todayLocalKey = format(now, 'yyyy-MM-dd')
            const weekStartKey = formatInTimeZone(currentWeek.weekStartUtc, 'UTC', 'yyyy-MM-dd')
            const weekEndKey = formatInTimeZone(currentWeek.weekEndUtc, 'UTC', 'yyyy-MM-dd')
            if (todayLocalKey >= weekStartKey && todayLocalKey <= weekEndKey) {
                return currentWeek
            }
        } else if (zonedNow >= currentStart && zonedNow <= currentEnd) {
            return currentWeek
        }

        currentStart = addDays(currentStart, 7)
    }

    return fallbackWeek
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

    await syncChallengeStatuses()

    const visibilityFilter = session.user.role === "ADMIN"
        ? {}
        : {
            OR: [
                { isPublic: true },
                { organizerId: session.user.id }
            ]
        }

    const challengesQuery = {
        where: {
            AND: [
                {
                    OR: [
                        { organizerId: session.user.id },
                        {
                            participants: {
                                some: {
                                    userId: session.user.id,
                                    status: { in: ["APPROVED", "PENDING"] }
                                }
                            }
                        }
                    ]
                },
                visibilityFilter
            ]
        },
        select: {
            id: true,
            name: true,
            status: true,
            organizerId: true,
            startDate: true,
            endDate: true,
            timezone: true,
            metrics: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    unit: true,
                    inputType: true,
                    aggregationMethod: true,
                    scoringFrequency: true,
                    challengeId: true,
                    pointsPerUnit: true,
                    maxPointsPerPeriod: true,
                    maxPointsTotal: true,
                    qualifiers: {
                        select: { id: true, value: true }
                    },
                    scoringRules: {
                        select: {
                            id: true,
                            qualifierId: true,
                            comparisonType: true,
                            minValue: true,
                            maxValue: true,
                            points: true
                        }
                    },
                    activityLogs: {
                        where: { userId: session.user.id },
                        select: {
                            date: true,
                            value: true,
                            qualifierId: true,
                            createdAt: true,
                            participantId: true
                        }
                    },
                    scoreSnapshots: {
                        where: { userId: session.user.id },
                        orderBy: { periodStart: 'desc' },
                        select: {
                            totalPoints: true,
                            participantId: true,
                            periodStart: true
                        }
                    }
                }
            },
            participants: {
                where: { userId: session.user.id },
                select: {
                    id: true,
                    userId: true,
                    challengeId: true,
                    name: true,
                    displayName: true,
                    joinedAt: true,
                    status: true
                }
            }
        }
    } satisfies Prisma.ChallengeFindManyArgs

    const challenges = await prisma.challenge.findMany(challengesQuery)

    // Flatten challenges into participation items
    const dashboardItems: DashboardItem[] = []
    for (const challenge of challenges) {
        if (challenge.participants.length > 0) {
            for (const participant of challenge.participants) {
                dashboardItems.push({
                    challenge,
                    participant,
                    key: `${challenge.id}-${participant.id}`
                })
            }
            continue
        }

        if (challenge.organizerId === session.user.id) {
            dashboardItems.push({
                challenge,
                participant: null,
                key: `${challenge.id}-organizer`
            })
        }
    }

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
                    <span className="text-xl font-bold">ChallengeForge</span>
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
                            Create Challenge
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
                                                <div className="font-bold text-neutral-200 truncate">{participant.name || participant.user.name}</div>
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

                    <section className="lg:col-span-3">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-500" />
                                Active Challenges
                            </h3>
                            <Link href="/challenges" className="text-sm text-neutral-500 hover:text-yellow-500 transition-colors font-medium">
                                More
                            </Link>
                        </div>

                        {dashboardItems.length === 0 ? (
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
                                {dashboardItems.map((item) => {
                                    const { challenge, participant, key } = item;
                                    const useDateOnlyWeekMode = isMidnightUTC(challenge.startDate)
                                    const timeZone = useDateOnlyWeekMode ? 'UTC' : challenge.timezone || 'UTC';
                                    const { weekStartUtc, weekEndUtc, rangeLabel } = getCurrentChallengeWeekWindow(
                                        challenge.startDate,
                                        challenge.endDate,
                                        timeZone,
                                        new Date(),
                                        useDateOnlyWeekMode
                                    );
                                    return (
                                        <div key={key} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 hover:border-neutral-700 transition-all flex flex-col md:flex-row justify-between gap-6 group">
                                            <div className="space-y-4 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <h4 className="text-xl font-bold group-hover:text-yellow-500 transition-colors uppercase">
                                                            {challenge.name}
                                                        </h4>
                                                        {participant && (participant.displayName || participant.name) && (
                                                            <span className="text-sm text-neutral-500 font-bold tracking-tight mt-0.5">
                                                                Logging as: <span className="text-yellow-500/80">{participant.displayName || participant.name}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs font-bold text-neutral-500 capitalize bg-neutral-950 px-3 py-1 rounded-full border border-neutral-800">
                                                        {challenge.status.toLowerCase()}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                                    {challenge.metrics.map((m) => {
                                                        const participantSnapshots = m.scoreSnapshots.filter((snapshot) => snapshot.participantId === participant?.id);
                                                        const lastSnapshot = participantSnapshots[0];

                                                        const participantLogs = m.activityLogs.filter((log) => log.participantId === participant?.id);
                                                        const weekLogs = participantLogs.filter((log) =>
                                                            log.date >= weekStartUtc && log.date <= weekEndUtc
                                                        );

                                                        const scoreParticipant = (participant || { userId: session.user.id }) as ScoreParticipantArg;
                                                        const { totalPoints: weekScore } = calculateScoreFromLogs(
                                                            weekLogs as ScoreLogsArg,
                                                            m as ScoreMetricArg,
                                                            scoreParticipant,
                                                            timeZone
                                                        );
                                                        const totalScore = lastSnapshot?.totalPoints || 0;

                                                        return (
                                                            <div key={m.id} className="bg-neutral-950/40 rounded-2xl p-3 border border-neutral-800 hover:border-neutral-700/50 transition-all flex flex-col justify-between gap-3">
                                                                <div className="text-[10px] sm:text-[11px] font-black text-neutral-500 uppercase tracking-widest truncate" title={m.name}>{m.name}</div>

                                                                <div className="flex items-center justify-between gap-2 border-t border-neutral-800/50 pt-3">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[8px] text-neutral-600 font-black uppercase tracking-tighter">
                                                                            Week <span className="text-neutral-700/80 ml-0.5">({rangeLabel})</span>
                                                                        </span>
                                                                        <span className="text-lg font-black text-neutral-100 tabular-nums">
                                                                            {weekScore}
                                                                            <span className="text-[10px] text-neutral-600 font-bold ml-0.5">pts</span>
                                                                        </span>
                                                                    </div>

                                                                    <div className="w-px h-6 bg-neutral-800/80" />

                                                                    <div className="flex flex-col text-right">
                                                                        <span className="text-[8px] text-neutral-600 font-black uppercase tracking-tighter">Total</span>
                                                                        <span className="text-lg font-black text-yellow-500 tabular-nums">
                                                                            {totalScore}
                                                                            <span className="text-[10px] text-yellow-600/50 font-bold ml-0.5">pts</span>
                                                                        </span>
                                                                    </div>
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
                                                        showPendingMessage={false}
                                                        initialParticipantId={participant?.id}
                                                        participants={challenge.participants.map((challengeParticipant) => ({
                                                            id: challengeParticipant.id,
                                                            userId: challengeParticipant.userId,
                                                            challengeId: challengeParticipant.challengeId,
                                                            name: challengeParticipant.name,
                                                            displayName: challengeParticipant.displayName,
                                                            joinedAt: challengeParticipant.joinedAt,
                                                            status: challengeParticipant.status
                                                        }))}
                                                        metrics={challenge.metrics.map((metric) => ({
                                                            id: metric.id,
                                                            name: metric.name,
                                                            unit: metric.unit,
                                                            description: metric.description ?? undefined,
                                                            qualifiers: metric.qualifiers,
                                                            inputType: metric.inputType // Ensure inputType is passed
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
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </main >
        </div >
    )
}

function Shield({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" /></svg>
}
