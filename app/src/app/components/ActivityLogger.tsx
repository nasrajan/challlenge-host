'use client'

import { logActivities } from "@/app/actions/challenges"
import { toLocalISOString } from "@/lib/dateUtils"
import { Plus, X, Calendar, Activity, Info, CheckCircle2 } from "lucide-react"
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
    startDate: Date;
    endDate: Date;
}

export default function ActivityLogger({ challengeId, challengeName, metrics, startDate, endDate }: ActivityLoggerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const entries = [];
        const logDate = formData.get("logDate") as string;
        const notes = formData.get("notes") as string;

        for (const metric of metrics) {
            const valueStr = formData.get(`value_${metric.id}`) as string;
            if (valueStr && valueStr.trim() !== "") {
                entries.push({
                    metricId: metric.id,
                    value: parseFloat(valueStr),
                });
            }
        }

        if (entries.length === 0) {
            setError("Please enter at least one value.");
            setLoading(false);
            return;
        }

        const result = await logActivities({
            challengeId,
            logDate,
            notes,
            activities: entries
        });

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            setSuccess(true)
            setTimeout(() => {
                setIsOpen(false)
                setSuccess(false)
                router.refresh()
            }, 1500)
            setLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 px-6 py-3 rounded-2xl transition-all text-sm font-bold shadow-xl shadow-yellow-500/20 active:scale-95"
            >
                <Plus className="h-4 w-4" />
                Update Activities
            </button>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="px-8 py-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                    <div>
                        <h3 className="text-xl font-black flex items-center gap-2">
                            <Activity className="h-6 w-6 text-yellow-500" />
                            Update Activities
                        </h3>
                        <p className="text-xs text-neutral-500 font-bold tracking-widest mt-1">{challengeName}</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-500 hover:text-white transition-all">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {success ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="h-20 w-20 bg-green-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-10 w-10 text-green-500" />
                            </div>
                            <h4 className="text-2xl font-black">Activities Updated!</h4>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm flex items-center gap-3">
                                    <Info className="h-5 w-5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="grid gap-6">
                                <div className="grid gap-3">
                                    <label className="text-[10px] font-black text-neutral-500 ml-1">Date</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 group-focus-within:text-yellow-500 transition-colors" />
                                        <input
                                            name="logDate"
                                            type="date"
                                            defaultValue={(() => {
                                                const today = new Date();
                                                const start = new Date(startDate);
                                                const end = new Date(endDate);
                                                if (today < start) return toLocalISOString(start);
                                                if (today > end) return toLocalISOString(end);
                                                return toLocalISOString(today);
                                            })()}
                                            min={toLocalISOString(startDate)}
                                            max={toLocalISOString(endDate)}
                                            required
                                            className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-neutral-500 ml-1">Daily Scores</label>
                                    <div className="grid gap-4">
                                        {metrics.map(metric => (
                                            <div key={metric.id} className="bg-neutral-800/30 border border-neutral-800/50 rounded-2xl p-4 flex items-center gap-4 group hover:border-neutral-700 transition-all">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-sm text-neutral-200">{metric.name}</h4>
                                                    <span className="text-[10px] font-black text-neutral-500">{metric.unit}</span>
                                                </div>
                                                <div className="w-32">
                                                    <input
                                                        name={`value_${metric.id}`}
                                                        type="number"
                                                        step="any"
                                                        placeholder="0"
                                                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-right font-black"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    <label className="text-[10px] font-black text-neutral-500 ml-1">Notes (Optional)</label>
                                    <textarea
                                        name="notes"
                                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all h-24 text-sm resize-none"
                                        placeholder="Add some context to your mission today..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-8 py-4 rounded-2xl border border-neutral-800 font-bold hover:bg-neutral-800 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="flex-[2] bg-yellow-500 text-neutral-950 font-black py-4 rounded-2xl hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/20 disabled:opacity-50 active:scale-95"
                                >
                                    {loading ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #262626;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #404040;
                }
            `}</style>
        </div>
    )
}
