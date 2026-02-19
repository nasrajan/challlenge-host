'use client'

import { getActivityLogsForDate, logActivities } from "@/app/actions/challenges"
import { toLocalISOString } from "@/lib/dateUtils"
import { Plus, X, Calendar, Activity, Info, CheckCircle2, ChevronDown } from "lucide-react"
import { MetricInputType, ParticipantStatus, ScoringFrequency, AggregationMethod } from "@prisma/client"
import { useEffect, useState, memo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Alert from "./Alert"

interface Metric {
    id: string;
    name: string;
    unit: string;
    inputType: MetricInputType;
    description?: string;
    qualifiers: { id: string; value: string }[];
    maxPointsPerPeriod?: number | null;
    pointsPerUnit?: number | null;
    scoringFrequency: ScoringFrequency;
    aggregationMethod: AggregationMethod;
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
    participants: Participant[];
    startDate: Date;
    endDate: Date;
    showPendingMessage?: boolean;
    initialParticipantId?: string;
    timezone: string;
}

const MetricInput = memo(({
    metric,
    value,
    onChange,
    type
}: {
    metric: Metric,
    value: string | boolean,
    onChange: (id: string, val: string | boolean) => void,
    type: MetricInputType
}) => {
    const [showTooltip, setShowTooltip] = useState(false)

    return (
        <div className="bg-neutral-800/30 border border-neutral-800/50 rounded-2xl px-4 py-3 sm:py-4 flex items-center gap-4 group hover:border-neutral-700 transition-all relative">
            <div className="flex-1 min-w-0">
                <div className="relative inline-block w-full">
                    <h4 className="font-bold text-sm text-neutral-200 leading-tight inline mr-1.5">
                        {metric.name}
                    </h4>
                    {metric.description && (
                        <div className="inline-block align-middle">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTooltip(!showTooltip);
                                }}
                                className={`p-0.5 rounded-full transition-all ${showTooltip ? 'bg-yellow-500/20 text-yellow-500' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                <Info className="h-3.5 w-3.5" />
                            </button>

                            {showTooltip && (
                                <>
                                    <div
                                        className="fixed inset-0 z-[60]"
                                        onClick={() => setShowTooltip(false)}
                                    />
                                    <div className="absolute left-0 top-full mt-2 w-64 bg-neutral-900 border border-neutral-700 p-4 rounded-xl shadow-2xl z-[70] animate-in fade-in zoom-in slide-in-from-top-2 duration-200">
                                        <div className="text-xs text-neutral-300 leading-relaxed font-medium whitespace-normal">
                                            {metric.description}
                                        </div>
                                        <div className="absolute left-3 -top-1 w-2 h-2 bg-neutral-900 border-l border-t border-neutral-700 rotate-45" />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <div className="mt-1">
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-tight">{metric.unit}</span>
                </div>
            </div>
            <div className="w-32 flex justify-end">
                {type === 'CHECKBOX' ? (
                    <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => onChange(metric.id, e.target.checked)}
                        className="h-8 w-8 rounded-lg border-neutral-700 bg-neutral-900 text-yellow-500 focus:ring-yellow-500/50 accent-yellow-500 cursor-pointer"
                    />
                ) : type === 'TEXT' ? (
                    <input
                        type="text"
                        placeholder="Enter note..."
                        value={value as string || ""}
                        onChange={(e) => onChange(metric.id, e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-sm font-medium text-neutral-200"
                    />
                ) : (
                    <input
                        type="number"
                        step="any"
                        min="0"
                        max={(() => {
                            if (metric.maxPointsPerPeriod === null || metric.maxPointsPerPeriod === undefined || metric.maxPointsPerPeriod === Infinity) return undefined;
                            const ppu = metric.pointsPerUnit || 1;
                            return metric.maxPointsPerPeriod / ppu;
                        })()}
                        placeholder="0"
                        value={value as string || ""}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                                onChange(metric.id, "");
                                return;
                            }

                            const numVal = parseFloat(val);
                            if (!isNaN(numVal)) {
                                if (numVal < 0) {
                                    onChange(metric.id, "0");
                                    return;
                                }

                                if (metric.maxPointsPerPeriod !== null && metric.maxPointsPerPeriod !== undefined && metric.maxPointsPerPeriod !== Infinity) {
                                    const ppu = metric.pointsPerUnit || 1;
                                    const maxVal = metric.maxPointsPerPeriod / ppu;
                                    if (numVal > maxVal) {
                                        // Clamp to max value
                                        onChange(metric.id, String(maxVal));
                                        return;
                                    }
                                }
                            }
                            onChange(metric.id, val);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-right font-black"
                    />
                )}
            </div>
        </div>
    )
})

MetricInput.displayName = "MetricInput"

export default function ActivityLogger({
    challengeId,
    challengeName,
    metrics,
    participants,
    startDate,
    endDate,
    showPendingMessage = true,
    initialParticipantId,
    timezone
}: ActivityLoggerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedParticipantId, setSelectedParticipantId] = useState(() => {
        if (initialParticipantId) return initialParticipantId;
        const firstApproved = participants.find(p => p.status === 'APPROVED')
        return firstApproved?.id || ""
    })

    // Deduplicate metrics by ID just in case source data has duplicates
    const uniqueMetrics = metrics.filter((m, index, self) =>
        index === self.findIndex((t) => t.id === m.id)
    );
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

    const handleCheckboxChange = useCallback((id: string, val: string | boolean) => {
        setCheckboxValues(prev => ({ ...prev, [id]: val as boolean }))
    }, [])

    const handleTextChange = useCallback((id: string, val: string | boolean) => {
        setTextValues(prev => ({ ...prev, [id]: val as string }))
    }, [])

    const handleMetricChange = useCallback((id: string, val: string | boolean) => {
        setMetricValues(prev => ({ ...prev, [id]: val as string }))
    }, [])

    const loadLogs = useCallback(async () => {
        if (!isOpen) return
        try {
            setLoadingLogs(true)
            setError(null)

            const logs = await getActivityLogsForDate(challengeId, selectedDate, selectedParticipantId)

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
                    const currentVal = parseFloat(nextMetricValues[metric.id] || "0")
                    nextMetricValues[metric.id] = String(currentVal + log.value)
                }

                if (!nextNotes && log.notes && metric.inputType !== "TEXT") {
                    nextNotes = log.notes
                }
            })

            setMetricValues(nextMetricValues)
            setCheckboxValues(nextCheckboxValues)
            setTextValues(nextTextValues)
            setNotesValue(nextNotes)
        } catch {
            setError("Failed to load logs for this date.")
        } finally {
            setLoadingLogs(false)
        }
    }, [challengeId, isOpen, metrics, selectedDate, selectedParticipantId])

    useEffect(() => {
        void loadLogs()
    }, [loadLogs])

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

        // Date Validation
        const startStr = toLocalISOString(startDate)
        const endStr = toLocalISOString(endDate)
        const todayStr = toLocalISOString(new Date())

        if (logDate < startStr) {
            setError(`This challenge starts on ${startStr}. Please select a valid date.`)
            setLoading(false)
            return
        }
        if (logDate > endStr) {
            setError(`This challenge ended on ${endStr}. Please select a valid date.`)
            setLoading(false)
            return
        }
        if (logDate > todayStr) {
            setError("You cannot log activities for future dates.")
            setLoading(false)
            return
        }
        const notes = notesValue

        for (const metric of uniqueMetrics) {
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
                    const numVal = parseFloat(valueStr);
                    if (!isNaN(numVal)) {
                        if (numVal < 0) {
                            setError(`Value for ${metric.name} cannot be negative.`);
                            setLoading(false);
                            return;
                        }

                        if (metric.maxPointsPerPeriod !== null && metric.maxPointsPerPeriod !== undefined && metric.maxPointsPerPeriod !== Infinity) {
                            const ppu = metric.pointsPerUnit || 1;
                            const maxVal = metric.maxPointsPerPeriod / ppu;

                            if (numVal > maxVal) {
                                setError(`Value for ${metric.name} exceeds the ${metric.scoringFrequency.toLowerCase()} cap.`);
                                setLoading(false);
                                return;
                            }
                        }
                    }
                    entries.push({
                        metricId: metric.id,
                        value: numVal,
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

    const approvedParticipants = participants.filter(p => p.status === 'APPROVED')
    const pendingParticipants = participants.filter(p => p.status === 'PENDING')

    if (!isOpen) {
        if (approvedParticipants.length > 0) {
            return (
                <button
                    onClick={() => {
                        setSelectedDate(getInitialLogDate(startDate, endDate))
                        setIsOpen(true)
                    }}
                    className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 px-6 py-3 rounded-2xl transition-all text-sm font-bold shadow-xl shadow-yellow-500/20 active:scale-95"
                >
                    <Plus className="h-4 w-4" />
                    Update Activities
                </button>
            )
        }

        if (pendingParticipants.length > 0 && showPendingMessage) {
            return (
                <div className="flex items-center gap-3 bg-neutral-900/50 border border-neutral-800 px-6 py-3 rounded-2xl text-sm">
                    <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                    <span className="text-neutral-400 font-medium">
                        Approval pending for: <span className="text-neutral-200 font-bold">{pendingParticipants.map(p => p.displayName || p.name).join(", ")}</span>
                    </span>
                </div>
            )
        }

        return null;
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

                <form noValidate onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <Alert type="error" message={error} />
                    <Alert type="success" message={success ? "Log saved successfully!" : null} />

                    <div className="grid gap-6">
                        {approvedParticipants.length > 1 && (
                            <div className="grid gap-3">
                                <label className="text-[10px] font-black text-neutral-500 ml-1">Participant</label>
                                <div className="relative">
                                    <select
                                        value={selectedParticipantId}
                                        onChange={(e) => setSelectedParticipantId(e.target.value)}
                                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all font-bold appearance-none text-neutral-200"
                                    >
                                        {approvedParticipants.map(p => (
                                            <option key={p.id} value={p.id}>{p.displayName || p.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 pointer-events-none" />
                                </div>
                            </div>
                        )}
                        <div className="grid gap-3">
                            <label className="text-[10px] font-black text-neutral-500 ml-1">Date</label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-500 transition-colors" />
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
                                    className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-2xl pl-12 pr-6 py-2 outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all font-bold date-input-field"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-neutral-500 ml-1">Daily Scores</label>
                            {uniqueMetrics.map(metric => (
                                <MetricInput
                                    key={metric.id}
                                    metric={metric}
                                    type={metric.inputType}
                                    value={
                                        metric.inputType === 'CHECKBOX'
                                            ? checkboxValues[metric.id]
                                            : metric.inputType === 'TEXT'
                                                ? textValues[metric.id]
                                                : metricValues[metric.id]
                                    }
                                    onChange={
                                        metric.inputType === 'CHECKBOX'
                                            ? handleCheckboxChange
                                            : metric.inputType === 'TEXT'
                                                ? handleTextChange
                                                : handleMetricChange
                                    }
                                />
                            ))}
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
                .date-input-field::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 6px;
                    transition: all 0.2s;
                }
                .date-input-field::-webkit-calendar-picker-indicator:hover {
                    background: rgba(255, 255, 255, 0.1);
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
