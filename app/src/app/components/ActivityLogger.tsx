'use client'

import { getActivityLogsForDate, logActivities } from "@/app/actions/challenges"
import { toLocalISOString } from "@/lib/dateUtils"
import { Plus, X, Calendar, Activity, Info, CheckCircle2, ChevronDown } from "lucide-react"
import { MetricInputType, ParticipantStatus } from "@prisma/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Metric {
    id: string;
    name: string;
    unit: string;
    inputType: MetricInputType;
    qualifiers: { id: string; value: string }[];
}

interface Participant {
    id: string;
    userId: string;
    challengeId: string;
    name: string;
    displayName: string | null;
    joinedAt: Date;
    status: ParticipantStatus;
}

interface ActivityLoggerProps {
    challengeId: string;
    challengeName: string;
    metrics: Metric[];
    participants: Participant[]; // Added participants
    startDate: Date;
    endDate: Date;
}

export default function ActivityLogger({
    challengeId,
    challengeName,
    metrics,
    participants,
    startDate,
    endDate
}: ActivityLoggerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedParticipantId, setSelectedParticipantId] = useState(participants[0]?.id || "")
    const [loading, setLoading] = useState(false)
    const [loadingLogs, setLoadingLogs] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [selectedDate, setSelectedDate] = useState(() => getInitialLogDate(startDate, endDate))
    const [metricValues, setMetricValues] = useState<Record<string, string>>({})
    const [checkboxValues, setCheckboxValues] = useState<Record<string, boolean>>({})
    const [textValues, setTextValues] = useState<Record<string, string>>({})
    const [notesValue, setNotesValue] = useState("")
    const router = useRouter()

    useEffect(() => {
        if (isOpen) {
            setSelectedDate(getInitialLogDate(startDate, endDate))
        }
    }, [isOpen, startDate, endDate])

    useEffect(() => {
        if (!isOpen) return
        let active = true
        setLoadingLogs(true)
        setError(null)

        getActivityLogsForDate(challengeId, selectedDate, selectedParticipantId)
            .then((logs) => {
                if (!active) return
                const nextMetricValues: Record<string, string> = {}
                const nextCheckboxValues: Record<string, boolean> = {}
                const nextTextValues: Record<string, string> = {}
                let nextNotes = ""

                logs.forEach((log) => {
                    const metric = metrics.find((m) => m.id === log.metricId)
                    if (!metric) return

                    if (metric.inputType === "CHECKBOX") {
                        nextCheckboxValues[metric.id] = log.value > 0
                    } else if (metric.inputType === "TEXT") {
                        nextTextValues[metric.id] = log.notes || ""
                    } else {
                        nextMetricValues[metric.id] = String(log.value)
                    }

                    if (!nextNotes && log.notes && metric.inputType !== "TEXT") {
                        nextNotes = log.notes
                    }
                })

                setMetricValues(nextMetricValues)
                setCheckboxValues(nextCheckboxValues)
                setTextValues(nextTextValues)
                setNotesValue(nextNotes)
            })
            .catch(() => {
                if (active) {
                    setError("Failed to load logs for this date.")
                }
            })
            .finally(() => {
                if (active) setLoadingLogs(false)
            })

        return () => {
            active = false
        }
    }, [challengeId, selectedDate, isOpen, metrics, selectedParticipantId])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = e.currentTarget // Capture reference immediately
        setLoading(true)
        setError(null)
        setSuccess(false) // Reset success state for new attempt

        if (!selectedParticipantId) {
            setError("Please select a participant.")
            setLoading(false)
            return
        }

        const entries = []
        const logDate = selectedDate
        const notes = notesValue

        for (const metric of metrics) {
            if (metric.inputType === 'CHECKBOX') {
                const checked = checkboxValues[metric.id];
                if (checked) {
                    entries.push({ metricId: metric.id, value: 1 });
                }
            } else if (metric.inputType === 'TEXT') {
                const text = textValues[metric.id] || "";
                if (text && text.trim() !== "") {
                    entries.push({ metricId: metric.id, value: 1, notes: text });
                }
            } else {
                const valueStr = metricValues[metric.id] || "";
                if (valueStr && valueStr.trim() !== "") {
                    entries.push({
                        metricId: metric.id,
                        value: parseFloat(valueStr),
                    });
                }
            }
        }

        if (entries.length === 0) {
            setError("Please enter at least one value.");
            setLoading(false);
            return;
        }

        const result = await logActivities({
            challengeId,
            participantId: selectedParticipantId,
            logDate,
            notes,
            activities: entries
        });

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            setSuccess(true)
            // Reset form fields but keep selected participant and date
            form.reset();
            // We need to re-set the date because form.reset() clears it
            const dateInput = form.querySelector('input[name="logDate"]') as HTMLInputElement;
            if (dateInput) {
                dateInput.value = logDate;
            }

            setLoading(false)
            // Success stays true to show the message, but it's not a blocking state anymore
        }
    }

    const handleFinish = () => {
        setIsOpen(false)
        router.refresh()
        router.push("/dashboard")
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
                        <p className="text-xs text-neutral-500 font-bold tracking-widest mt-1 uppercase">{challengeName}</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-500 hover:text-white transition-all">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <Info className="h-5 w-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-2xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                            Log saved successfully!.
                        </div>
                    )}

                    <div className="grid gap-6">
                        {participants.length > 1 && (
                            <div className="grid gap-3">
                                <label className="text-[10px] font-black text-neutral-500 ml-1">Participant</label>
                                <div className="relative">
                                    <select
                                        value={selectedParticipantId}
                                        onChange={(e) => setSelectedParticipantId(e.target.value)}
                                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all font-bold appearance-none text-neutral-200"
                                    >
                                        {participants.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 pointer-events-none" />
                                </div>
                            </div>
                        )}
                        <div className="grid gap-3">
                            <label className="text-[10px] font-black text-neutral-500 ml-1">Date</label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 group-focus-within:text-yellow-500 transition-colors" />
                                <input
                                    name="logDate"
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    min={toLocalISOString(startDate)}
                                    max={(() => {
                                        const today = new Date();
                                        const end = new Date(endDate);
                                        // Returns the earlier of the two dates
                                        const maxDate = today < end ? today : end;
                                        return toLocalISOString(maxDate);
                                    })()}
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
                                        <div className="w-32 flex justify-end">
                                            {metric.inputType === 'CHECKBOX' ? (
                                                <input
                                                    name={`value_${metric.id}`}
                                                    type="checkbox"
                                                    value="1"
                                                    checked={!!checkboxValues[metric.id]}
                                                    onChange={(e) => {
                                                        setCheckboxValues((prev) => ({
                                                            ...prev,
                                                            [metric.id]: e.target.checked
                                                        }))
                                                    }}
                                                    className="h-8 w-8 rounded-lg border-neutral-700 bg-neutral-900 text-yellow-500 focus:ring-yellow-500/50 accent-yellow-500"
                                                />
                                            ) : metric.inputType === 'TEXT' ? (
                                                <input
                                                    name={`value_${metric.id}`}
                                                    type="text"
                                                    placeholder="Enter note..."
                                                    value={textValues[metric.id] || ""}
                                                    onChange={(e) => {
                                                        setTextValues((prev) => ({
                                                            ...prev,
                                                            [metric.id]: e.target.value
                                                        }))
                                                    }}
                                                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-sm font-medium text-neutral-200"
                                                />
                                            ) : (
                                                <input
                                                    name={`value_${metric.id}`}
                                                    type="number"
                                                    step="any"
                                                    min="0"
                                                    placeholder="0"
                                                    value={metricValues[metric.id] || ""}
                                                    onChange={(e) => {
                                                        setMetricValues((prev) => ({
                                                            ...prev,
                                                            [metric.id]: e.target.value
                                                        }))
                                                    }}
                                                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-right font-black"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <label className="text-[10px] font-black text-neutral-500 ml-1">Notes (Optional)</label>
                            <textarea
                                name="notes"
                                value={notesValue}
                                onChange={(e) => setNotesValue(e.target.value)}
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
                            disabled={loading || loadingLogs}
                            type="submit"
                            className="flex-[2] bg-yellow-500 text-neutral-950 font-black py-4 rounded-2xl hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/20 disabled:opacity-50 active:scale-95"
                        >
                            {loading ? "Saving..." : "Save"}
                        </button>
                    </div>
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

function getInitialLogDate(startDate: Date, endDate: Date) {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (today < start) return toLocalISOString(start);
    if (today > end) return toLocalISOString(end);
    return toLocalISOString(today);
}
