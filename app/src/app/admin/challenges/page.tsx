export const dynamic = 'force-dynamic'

import { Trophy, BarChart, Trash2, Edit2, Calendar, ChevronLeft, Zap, Clock } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import Link from "next/link"
import { approveParticipant, syncChallengeStatuses } from "@/app/actions/challenges"
import DateDisplay from "@/app/components/DateDisplay"

export default async function AdminChallengesPage() {
    await syncChallengeStatuses()

    const pendingParticipants = await prisma.participant.findMany({
        where: { status: "PENDING" },
        include: {
            user: true,
            challenge: true
        },
        orderBy: { joinedAt: "desc" }
    })

    const allChallenges = await prisma.challenge.findMany({
        include: {
            organizer: true,
            metrics: true,
            _count: {
                select: { participants: true }
            }
        },
        orderBy: { startDate: 'asc' }
    })

    const activeChallenges = allChallenges.filter(c => c.status === 'ACTIVE')
    const upcomingChallenges = allChallenges.filter(c => c.status === 'UPCOMING')
    const completedChallenges = allChallenges.filter(c => c.status === 'COMPLETED')

    const ChallengeTable = ({ challenges, title, icon: Icon, colorClass }: any) => (
        <section className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl mb-12">
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
                <h2 className={`text-xl font-bold flex items-center gap-2 italic tracking-tighter ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                    {title}
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-neutral-500 text-[10px] font-black tracking-widest border-b border-neutral-800">
                            <th className="px-6 py-4">Challenge Name</th>
                            <th className="px-6 py-4">Tasks</th>
                            <th className="px-6 py-4">Organizer</th>
                            <th className="px-6 py-4">Window</th>
                            <th className="px-6 py-4 text-right">Participants</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 text-sm">
                        {challenges.map((challenge: any) => (
                            <tr key={challenge.id} className="hover:bg-neutral-800/40 transition-colors group">
                                <td className="px-6 py-4 max-w-xs">
                                    <div className="font-bold text-neutral-200 group-hover:text-white transition-colors truncate">
                                        {challenge.name}
                                    </div>
                                    <div className="text-[10px] text-neutral-600 truncate font-mono tracking-tighter">
                                        ID: {challenge.id}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {challenge.metrics.map((m: any) => (
                                            <span key={m.id} className="bg-neutral-950 text-neutral-500 text-[9px] font-black px-1.5 py-0.5 rounded border border-neutral-800 ">
                                                {m.name}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-neutral-200">{challenge.organizer?.name || "Unknown"}</div>
                                    <div className="text-[10px] text-neutral-600">{challenge.organizer?.email || "-"}</div>
                                </td>
                                <td className="px-6 py-4 text-neutral-500 font-mono text-xs">
                                    <div className="flex flex-col">
                                        <span>S: <DateDisplay date={challenge.startDate} /></span>
                                        <span className="text-neutral-700">E: <DateDisplay date={challenge.endDate} /></span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right font-black text-neutral-400">
                                    {challenge._count.participants}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        {(challenge.status === 'UPCOMING' || challenge.status === 'ACTIVE') && (
                                            <Link
                                                href={`/admin/challenges/${challenge.id}/edit`}
                                                className="text-neutral-500 hover:text-blue-400 transition-colors p-2 bg-neutral-950 rounded-lg border border-neutral-800"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Link>
                                        )}
                                        <form action={async () => {
                                            'use server'
                                            await prisma.challenge.delete({ where: { id: challenge.id } })
                                            revalidatePath('/admin/challenges')
                                        }}>
                                            <button className="text-neutral-500 hover:text-red-500 transition-colors p-2 bg-neutral-950 rounded-lg border border-neutral-800">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col gap-6 mb-12">
                    <Link href="/admin" className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors w-fit">
                        <ChevronLeft className="h-4 w-4" />
                        Back to Control Center
                    </Link>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <BarChart className="h-8 w-8 text-yellow-500" />
                            <h1 className="text-3xl font-bold tracking-tight text-yellow-500 italic">Challenge Pool</h1>
                        </div>
                        <Link
                            href="/challenges/create"
                            className="bg-yellow-500 text-neutral-950 px-6 py-2 rounded-full font-black text-sm tracking-widest hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/10"
                        >
                            + Create a Challenge
                        </Link>
                    </div>
                </header>

                <ChallengeTable
                    challenges={activeChallenges}
                    title="Active Challenges"
                    icon={Zap}
                    colorClass="text-green-500"
                />

                {pendingParticipants.length > 0 && (
                    <section className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl mb-12">
                        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2 italic tracking-tighter text-yellow-500">
                                Pending Approvals
                            </h2>
                            <span className="text-xs font-black tracking-widest text-neutral-500 bg-neutral-950 px-3 py-1 rounded-full border border-neutral-800">
                                {pendingParticipants.length} pending
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-neutral-500 text-[10px] font-black tracking-widest border-b border-neutral-800">
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Challenge</th>
                                        <th className="px-6 py-4">Requested</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800 text-sm">
                                    {pendingParticipants.map((participant) => (
                                        <tr key={participant.id} className="hover:bg-neutral-800/40 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-neutral-200 group-hover:text-white transition-colors">{participant.user.name}</div>
                                                <div className="text-xs text-neutral-500">{participant.user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-300 font-semibold">
                                                {participant.challenge.name}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500 text-xs font-mono">
                                                <DateDisplay date={participant.joinedAt} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <form action={approveParticipant.bind(null, participant.id)}>
                                                    <button className="bg-yellow-500 text-neutral-950 px-4 py-2 rounded-xl font-bold text-xs hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20">
                                                        Approve
                                                    </button>
                                                </form>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                <ChallengeTable
                    challenges={upcomingChallenges}
                    title="Upcoming Challenges"
                    icon={Clock}
                    colorClass="text-blue-400"
                />

                {completedChallenges.length > 0 && (
                    <ChallengeTable
                        challenges={completedChallenges}
                        title="Archived Challenges"
                        icon={Calendar}
                        colorClass="text-neutral-500"
                    />
                )}
            </div>
        </div>
    )
}
