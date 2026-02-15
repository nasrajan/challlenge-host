import Link from "next/link";
import { ArrowRight, Trophy, Users, BarChart3 } from "lucide-react";

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-100">
            <header className="px-6 h-16 flex items-center border-b border-neutral-800">
                <Link className="flex items-center justify-center" href="#">
                    <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
                    <span className="font-bold text-xl tracking-tight">ChallengeForge</span>
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Link
                        className="text-sm font-medium hover:text-yellow-500 transition-colors"
                        href="/login"
                    >
                        Sign In
                    </Link>
                    <Link
                        className="text-sm font-medium hover:text-yellow-500 transition-colors"
                        href="/register"
                    >
                        Get Started
                    </Link>
                </nav>
            </header>
            <main className="flex-1">
                <section className="w-full py-24 md:py-32 lg:py-48 flex flex-col items-center text-center px-4">
                    <div className="space-y-6 max-w-3xl">
                        <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                            Level Up Your Life with Challenges
                        </h1>
                        <p className="mx-auto max-w-[700px] text-neutral-400 md:text-xl">
                            Create, join, and track challenges for fitness, reading, productivity, and more.
                            Compete with friends and visualize your progress.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                            <Link
                                href="/register"
                                className="inline-flex h-12 items-center justify-center rounded-md bg-yellow-500 px-8 text-sm font-medium text-neutral-950 shadow transition-colors hover:bg-yellow-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                            >
                                Start Chasing Goals
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex h-12 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900 px-8 text-sm font-medium text-neutral-100 shadow-sm transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                            >
                                Log In
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="w-full py-12 md:py-24 lg:py-32 bg-neutral-900">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex flex-col items-center text-center p-6 bg-neutral-950 rounded-xl border border-neutral-800">
                                <div className="p-3 bg-neutral-900 rounded-full mb-4">
                                    <Trophy className="h-8 w-8 text-yellow-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Create Challenges</h3>
                                <p className="text-neutral-400">
                                    Customizable challenges with flexible scoring, durations, and rules.
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center p-6 bg-neutral-950 rounded-xl border border-neutral-800">
                                <div className="p-3 bg-neutral-900 rounded-full mb-4">
                                    <Users className="h-8 w-8 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Compete & Collaborate</h3>
                                <p className="text-neutral-400">
                                    Join public challenges or invite friends to private groups.
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center p-6 bg-neutral-950 rounded-xl border border-neutral-800">
                                <div className="p-3 bg-neutral-900 rounded-full mb-4">
                                    <BarChart3 className="h-8 w-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Track Progress</h3>
                                <p className="text-neutral-400">
                                    Visual analytics, leaderboards, and detailed activity logs.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-neutral-800">
                <p className="text-xs text-neutral-500">
                    © 2024 ChallengeForge. All rights reserved.
                </p>
                <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-xs hover:underline underline-offset-4 text-neutral-500" href="#">
                        Terms of Service
                    </Link>
                    <Link className="text-xs hover:underline underline-offset-4 text-neutral-500" href="#">
                        Privacy
                    </Link>
                </nav>
            </footer>
        </div>
    );
}
