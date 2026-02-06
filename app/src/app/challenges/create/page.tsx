'use client'

import { createChallenge } from "@/app/actions/challenges"
import { Trophy, Calendar, Settings, BarChart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function CreateChallengePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const result = await createChallenge(formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            router.push("/dashboard")
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
            <div className="max-w-3xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        Host a New Challenge
                    </h1>
                    <p className="text-neutral-400 mt-2">Set up your challenge rules, metrics, and duration.</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {error && (
                        <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Section 1: Basic Info */}
                    <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
                        <div className="flex items-center gap-2 text-xl font-semibold border-b border-neutral-800 pb-3">
                            <Settings className="h-5 w-5 text-neutral-400" />
                            Challenge Basics
                        </div>

                        <div className="grid gap-6">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Challenge Name</label>
                                <input
                                    name="name"
                                    required
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none"
                                    placeholder="e.g. 30 Days of Fitness"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Description</label>
                                <textarea
                                    name="description"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none h-32"
                                    placeholder="What is this challenge about?"
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-400 mb-2">Start Date</label>
                                    <input
                                        name="startDate"
                                        type="date"
                                        required
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-400 mb-2">End Date</label>
                                    <input
                                        name="endDate"
                                        type="date"
                                        required
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Metrics & Scoring */}
                    <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
                        <div className="flex items-center gap-2 text-xl font-semibold border-b border-neutral-800 pb-3">
                            <BarChart className="h-5 w-5 text-neutral-400" />
                            Logging & Scoring
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Metric Name</label>
                                <input
                                    name="metric"
                                    required
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none"
                                    placeholder="e.g. Steps"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Units</label>
                                <input
                                    name="unit"
                                    required
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none"
                                    placeholder="e.g. steps, km, pages"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Aggregation</label>
                                <select
                                    name="aggregation"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none"
                                >
                                    <option value="SUM">SUM (Total over time)</option>
                                    <option value="AVERAGE">AVERAGE</option>
                                    <option value="MAX">MAX (Highest single log)</option>
                                    <option value="MIN">MIN (Lowest single log)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Frequency</label>
                                <select
                                    name="frequency"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none"
                                >
                                    <option value="DAILY">DAILY</option>
                                    <option value="WEEKLY">WEEKLY</option>
                                    <option value="MONTHLY">MONTHLY</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Configuration */}
                    <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
                        <div className="flex items-center gap-2 text-xl font-semibold border-b border-neutral-800 pb-3">
                            <Calendar className="h-5 w-5 text-neutral-400" />
                            Settings & Privacy
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-neutral-400">Public Challenge</label>
                                <input type="checkbox" name="isPublic" value="true" defaultChecked className="h-5 w-5 rounded border-neutral-700 bg-neutral-800 text-yellow-500 focus:ring-yellow-500" />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-neutral-400">Requires Approval</label>
                                <input type="checkbox" name="requiresApproval" value="true" className="h-5 w-5 rounded border-neutral-700 bg-neutral-800 text-yellow-500 focus:ring-yellow-500" />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-neutral-400">Show Leaderboard</label>
                                <input type="checkbox" name="showLeaderboard" value="true" defaultChecked className="h-5 w-5 rounded border-neutral-700 bg-neutral-800 text-yellow-500 focus:ring-yellow-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-2">Max Participants (Optional)</label>
                                <input
                                    type="number"
                                    name="maxParticipants"
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none"
                                    placeholder="Unlimited"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-2 rounded-lg border border-neutral-800 hover:bg-neutral-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={loading}
                            type="submit"
                            className="px-8 py-2 rounded-lg bg-yellow-500 text-neutral-950 font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Launch Challenge"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
