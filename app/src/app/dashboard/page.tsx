import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Trophy, Plus, Settings, Users, LogOut } from "lucide-react"

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/login")
    }

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
                        <span className="text-xs text-neutral-500 uppercase tracking-wider">{session.user.role}</span>
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

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {/* USER role content */}
                    <div className="p-8 rounded-2xl border border-neutral-800 bg-neutral-900 group hover:border-neutral-700 transition-all">
                        <div className="p-3 bg-blue-500/10 rounded-xl w-fit mb-6 group-hover:bg-blue-500/20 transition-all">
                            <Users className="h-6 w-6 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">My Challenges</h3>
                        <p className="text-neutral-400 text-sm mb-6">You haven't joined any challenges yet.</p>
                        <Link href="/challenges" className="text-sm font-semibold text-blue-500 hover:text-blue-400 flex items-center gap-2">
                            Browse Public Challenges
                            <Plus className="h-4 w-4" />
                        </Link>
                    </div>

                    {/* ADMIN role specific controls */}
                    {session.user.role === 'ADMIN' && (
                        <div className="p-8 rounded-2xl border border-red-500/20 bg-red-500/5 group hover:bg-red-500/10 transition-all">
                            <div className="p-3 bg-red-500/10 rounded-xl w-fit mb-6">
                                <Shield className="h-6 w-6 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-red-500 mb-2">Admin Panel</h3>
                            <p className="text-neutral-400 text-sm mb-6">System-wide user and challenge management.</p>
                            <Link href="/admin" className="text-sm font-semibold text-red-500 hover:text-red-400 flex items-center gap-2">
                                Launch Controller
                                <Settings className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

function Shield({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" /></svg>
}
