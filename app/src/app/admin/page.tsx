import { Shield, User as UserIcon, BarChart, Settings, Activity, LogOut } from "lucide-react"
import Link from "next/link"

export default async function AdminPage() {
    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
            <div className="max-w-4xl mx-auto py-12">
                <header className="flex items-center justify-between gap-4 mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-4">
                        <Shield className="h-10 w-10 text-red-500" />
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Control Center</h1>
                            <p className="text-neutral-500 text-sm font-mono tracking-widest">System Administrator Dashboard</p>
                        </div>
                    </div>
                    <Link
                        href="/api/auth/signout"
                        className="flex items-center gap-2 text-neutral-500 hover:text-red-500 transition-colors text-sm font-bold"
                    >
                        <LogOut className="h-5 w-5" />
                        Logout
                    </Link>
                </header>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Challenges Card */}
                    <Link
                        href="/admin/challenges"
                        className="group relative bg-neutral-900 rounded-3xl border border-neutral-800 p-8 shadow-2xl hover:border-yellow-500/50 transition-all hover:scale-[1.02] overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity className="h-32 w-32 text-yellow-500" />
                        </div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="bg-yellow-500/10 p-3 rounded-2xl w-fit mb-6 border border-yellow-500/20">
                                <BarChart className="h-6 w-6 text-yellow-500" />
                            </div>
                            <h2 className="text-2xl font-black mb-2 uppercase italic tracking-tighter group-hover:text-yellow-500 transition-colors">
                                Manage Challenges
                            </h2>
                            <p className="text-neutral-500 text-sm leading-relaxed mb-8">
                                Oversee challenge parameters, verify logs, and adjust upcoming challenge rules and eligibility.
                            </p>
                            <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest text-yellow-500">
                                View Challenges
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </div>
                    </Link>

                    {/* Users Card */}
                    <Link
                        href="/admin/users"
                        className="group relative bg-neutral-900 rounded-3xl border border-neutral-800 p-8 shadow-2xl hover:border-blue-500/50 transition-all hover:scale-[1.02] overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Settings className="h-32 w-32 text-blue-500" />
                        </div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="bg-blue-500/10 p-3 rounded-2xl w-fit mb-6 border border-blue-500/20">
                                <UserIcon className="h-6 w-6 text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-black mb-2 uppercase italic tracking-tighter group-hover:text-blue-500 transition-colors">
                                Manage Users
                            </h2>
                            <p className="text-neutral-500 text-sm leading-relaxed mb-8">
                                Review users, adjust roles, and monitor participation across the across the platform.
                            </p>
                            <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-500">
                                View Users
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}
