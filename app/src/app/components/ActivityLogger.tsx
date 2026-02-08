'use client'

import { logActivity } from "@/app/actions/challenges"
import { Plus, X, Calendar, Activity, Info } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface Metric {
    id: string;
    name: string;
    unit: string;
    qualifiers: { id: string; value: string }[];
}

interface ActivityLoggerProps {
    challengeId: string;
    challengeName: string;
    metrics: Metric[];
}

export default function ActivityLogger({ challengeId, challengeName, metrics }: ActivityLoggerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        formData.append("challengeId", challengeId)

        const result = await logActivity(formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            setIsOpen(false)
            setLoading(false)
            router.refresh()
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 px-4 py-2 rounded-xl border border-neutral-700 transition-all text-sm font-semibold"
            >
                <Plus className="h-4 w-4" />
                Log Activity
            </button>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                    <h3 className="font-bold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-yellow-500" />
                        Log {challengeName}
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-xl text-xs flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider text-left">Which Metric?</label>
                            <select name="metricId" required className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-yellow-500 transition-all appearance-none">
                                {metrics.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider text-left">Value</label>
                            <input
                                name="value"
                                type="number"
                                step="any"
                                required
                                placeholder="0.00"
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-yellow-500 transition-all text-lg font-bold"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider text-left">Date</label>
                            <div className="relative">
                                <input
                                    name="logDate"
                                    type="date"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    required
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-yellow-500 transition-all pl-12"
                                />
                                <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-neutral-500" />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider text-left">Notes (Optional)</label>
                            <textarea
                                name="notes"
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-yellow-500 transition-all h-20 text-sm"
                                placeholder="How did it go?"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 px-4 py-3 rounded-xl border border-neutral-800 font-semibold hover:bg-neutral-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={loading}
                            type="submit"
                            className="flex-[2] bg-yellow-500 text-neutral-950 font-bold py-3 rounded-xl hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/10 disabled:opacity-50"
                        >
                            {loading ? "Logging..." : "Save Log Entry"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
