'use client'

import { createChallenge, updateChallenge } from "@/app/actions/challenges"
import {
    Trophy,
    Calendar,
    Settings,
    BarChart,
    Plus,
    Trash2,
    Info,
    Users
} from "lucide-react"
import { useRouter } from "next/navigation"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import {
    AggregationMethod,
    ScoringFrequency,
    ComparisonType,
    MetricInputType
} from "@prisma/client"
import { toLocalISOString } from "@/lib/dateUtils"

interface ScoringRule {
    comparisonType: ComparisonType;
    minValue: number | null;
    maxValue: number | null;
    points: number;
    qualifierValue?: string;
}

interface Metric {
    id: string; // client-side only or DB id
    name: string;
    unit: string;
    inputType: MetricInputType;
    aggregationMethod: AggregationMethod;
    scoringFrequency: ScoringFrequency;
    maxPointsPerPeriod: number | null;
    maxPointsTotal: number | null;
    qualifiers: { id: string; value: string }[];
    scoringRules: ScoringRule[];
}

interface ChallengeFormProps {
    initialData?: {
        id?: string;
        name: string;
        description: string | null;
        startDate: Date;
        endDate: Date;
        isPublic: boolean;
        requiresApproval: boolean;
        showLeaderboard: boolean;
        allowMultiParticipants: boolean;
        maxParticipants: number | null;
        organizerId?: string;
        metrics: any[];
    };
    mode: 'CREATE' | 'EDIT';
    organizers?: { id: string; name: string | null; email: string | null }[];
    currentUserRole?: string;
}

export default function ChallengeForm({ initialData, mode, organizers, currentUserRole }: ChallengeFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastAddedMetricId, setLastAddedMetricId] = useState<string | null>(null)

    // Map initial metrics if they exist
    const defaultMetrics: Metric[] = useMemo(() => initialData?.metrics.map(m => ({
        id: m.id || Math.random().toString(36).substr(2, 9),
        name: m.name,
        unit: m.unit,
        inputType: m.inputType || "NUMBER",
        aggregationMethod: m.aggregationMethod,
        scoringFrequency: m.scoringFrequency,
        maxPointsPerPeriod: m.maxPointsPerPeriod,
        maxPointsTotal: m.maxPointsTotal,
        qualifiers: m.qualifiers || [],
        scoringRules: m.scoringRules || [{
            comparisonType: "GREATER_THAN_EQUAL",
            minValue: 0,
            maxValue: null,
            points: 1,
            qualifierValue: "NONE"
        }]
    })) || [
            {
                id: Math.random().toString(36).substr(2, 9),
                name: "",
                unit: "",
                inputType: "NUMBER",
                aggregationMethod: "SUM",
                scoringFrequency: "DAILY",
                maxPointsPerPeriod: null,
                maxPointsTotal: null,
                qualifiers: [],
                scoringRules: [{
                    comparisonType: "GREATER_THAN_EQUAL",
                    minValue: 0,
                    maxValue: null,
                    points: 1,
                    qualifierValue: "NONE"
                }]
            }
        ], [initialData])

    const [metrics, setMetrics] = useState<Metric[]>(defaultMetrics)

    const addMetric = useCallback(() => {
        const newId = crypto.randomUUID()
        setMetrics((prev) => [
            ...prev,
            {
                id: newId,
                name: "",
                unit: "",
                inputType: "NUMBER",
                aggregationMethod: "SUM",
                scoringFrequency: "DAILY",
                maxPointsPerPeriod: null,
                maxPointsTotal: null,
                qualifiers: [],
                scoringRules: [{
                    comparisonType: "GREATER_THAN_EQUAL",
                    minValue: 0,
                    maxValue: null,
                    points: 1,
                    qualifierValue: "NONE"
                }]
            }
        ])
        setLastAddedMetricId(newId)
    }, [])

    const removeMetric = useCallback((id: string) => {
        setMetrics((prev) => prev.filter(m => m.id !== id))
    }, [])

    const updateMetric = useCallback((id: string, updates: Partial<Metric>) => {
        setMetrics((prev) => prev.map(m => m.id === id ? { ...m, ...updates } : m))
    }, [])

    useEffect(() => {
        if (!lastAddedMetricId) return
        const el = document.getElementById(`metric-${lastAddedMetricId}`)
        if (el) {
            requestAnimationFrame(() => {
                el.scrollIntoView({ behavior: "smooth", block: "start" })
            })
        }
        setLastAddedMetricId(null)
    }, [lastAddedMetricId, metrics])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        formData.set("metricsData", JSON.stringify(metrics))

        let result;
        if (mode === 'EDIT' && initialData?.id) {
            result = await updateChallenge(initialData.id, formData)
        } else {
            result = await createChallenge(formData)
        }

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            router.push(mode === 'EDIT' ? "/admin/challenges" : "/dashboard")
            router.refresh()
        }
    }



    return (
        <form onSubmit={handleSubmit} className="space-y-12">
            {error && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-6 rounded-2xl text-sm flex items-start gap-3">
                    <Info className="h-5 w-5 shrink-0" />
                    {error}
                </div>
            )}

            {/* Section 1: Basic Info */}
            <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-8 shadow-xl">
                <div className="flex items-center gap-3 text-2xl font-bold text-neutral-100">
                    <Settings className="h-6 w-6 text-neutral-400" />
                    Challenge Details
                </div>

                <div className="grid gap-8">
                    <div className="grid gap-2">
                        <label className="text-sm font-semibold text-neutral-400">Challenge Name</label>
                        <input
                            name="name"
                            required
                            defaultValue={initialData?.name}
                            className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-6 py-4 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none text-lg transition-all"
                            placeholder="e.g. Marathon of Kings"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-semibold text-neutral-400">Description</label>
                        <textarea
                            name="description"
                            defaultValue={initialData?.description || ""}
                            className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-6 py-4 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none h-32 transition-all"
                            placeholder="Detail the challenge objectives..."
                        />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-8">
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-neutral-400">Start Date</label>
                            <input
                                name="startDate"
                                type="date"
                                required
                                defaultValue={initialData ? toLocalISOString(initialData.startDate) : ""}
                                className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-6 py-4 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-neutral-400">End Date</label>
                            <input
                                name="endDate"
                                type="date"
                                required
                                defaultValue={initialData ? toLocalISOString(initialData.endDate) : ""}
                                className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-6 py-4 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Section: Visibility & Access */}
            <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-8 shadow-xl">
                <div className="flex items-center gap-3 text-2xl font-bold text-neutral-100">
                    <Users className="h-6 w-6 text-neutral-400" />
                    Visibility & Access
                </div>

                <div className="grid gap-8">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <label className="flex items-center gap-3 p-4 bg-neutral-800/30 border border-neutral-700/50 rounded-2xl cursor-pointer hover:bg-neutral-800/50 transition-all">
                            <input
                                type="checkbox"
                                name="isPublic"
                                value="true"
                                defaultChecked={initialData ? initialData.isPublic : true}
                                className="h-5 w-5 rounded border-neutral-700 bg-neutral-900 px-4 text-yellow-500 focus:ring-yellow-500/20"
                            />
                            <div>
                                <div className="font-bold text-neutral-100">Public Access</div>
                                <div className="text-xs text-neutral-500">Visible to everyone</div>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-4 bg-neutral-800/30 border border-neutral-700/50 rounded-2xl cursor-pointer hover:bg-neutral-800/50 transition-all">
                            <input
                                type="checkbox"
                                name="requiresApproval"
                                value="true"
                                defaultChecked={initialData ? initialData.requiresApproval : false}
                                className="h-5 w-5 rounded border-neutral-700 bg-neutral-900 text-yellow-500 focus:ring-yellow-500/20"
                            />
                            <div>
                                <div className="font-bold text-neutral-100">Require Approval</div>
                                <div className="text-xs text-neutral-500">Manual participant approval</div>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-4 bg-neutral-800/30 border border-neutral-700/50 rounded-2xl cursor-pointer hover:bg-neutral-800/50 transition-all">
                            <input
                                type="checkbox"
                                name="showLeaderboard"
                                value="true"
                                defaultChecked={initialData ? initialData.showLeaderboard : true}
                                className="h-5 w-5 rounded border-neutral-700 bg-neutral-900 text-yellow-500 focus:ring-yellow-500/20"
                            />
                            <div>
                                <div className="font-bold text-neutral-100">Show Leaderboard</div>
                                <div className="text-xs text-neutral-500">Public ranking visible</div>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-4 bg-neutral-800/30 border border-neutral-700/50 rounded-2xl cursor-pointer hover:bg-neutral-800/50 transition-all">
                            <input
                                type="checkbox"
                                name="allowMultiParticipants"
                                value="true"
                                defaultChecked={initialData ? initialData.allowMultiParticipants : false}
                                className="h-5 w-5 rounded border-neutral-700 bg-neutral-900 text-yellow-500 focus:ring-yellow-500/20"
                            />
                            <div>
                                <div className="font-bold text-neutral-100">Allow Multi-Participants</div>
                                <div className="text-xs text-neutral-500">Users can join with aliases</div>
                            </div>
                        </label>

                        {currentUserRole === 'ADMIN' && organizers && (
                            <div className="flex flex-col gap-2 p-4 bg-neutral-800/30 border border-neutral-700/50 rounded-2xl">
                                <label className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Assign Organizer
                                </label>
                                <select
                                    name="organizerId"
                                    defaultValue={initialData?.organizerId || ""}
                                    className="bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
                                    disabled={loading}
                                >
                                    <option value="">Select an Organizer</option>
                                    {organizers.map(organizer => (
                                        <option key={organizer.id} value={organizer.id}>
                                            {organizer.name || organizer.email} ({organizer.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2 max-w-sm">
                        <label className="text-sm font-semibold text-neutral-400">Max Participants</label>
                        <input
                            name="maxParticipants"
                            type="number"
                            min="1"
                            placeholder="Unlimited"
                            defaultValue={initialData?.maxParticipants || ""}
                            className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-6 py-4 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </section>


            {/* Section 2: Multi-Metric Config */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-2xl font-bold flex items-center gap-3 text-neutral-100">
                        <BarChart className="h-6 w-6 text-neutral-400" />
                        Scoring Criteria
                    </h2>
                    <button
                        type="button"
                        onClick={addMetric}
                        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 px-4 py-2 rounded-xl border border-neutral-700 transition-all font-semibold"
                    >
                        <Plus className="h-5 w-5" />
                        Add Task
                    </button>
                </div>

                <div className="space-y-8">
                    {metrics.map((metric, mIdx) => (
                        <MetricEditor
                            key={metric.id}
                            metric={metric}
                            mIdx={mIdx}
                            updateMetric={(updates) => updateMetric(metric.id, updates)}
                            removeMetric={() => removeMetric(metric.id)}
                        />
                    ))}
                </div>
            </div>

            <div className="flex justify-end items-center gap-6 pt-12 border-t border-neutral-800">
                <button
                    type="button"
                    disabled={loading}
                    onClick={() => router.back()}
                    className="text-neutral-400 hover:text-white font-semibold transition-colors"
                >
                    Cancel
                </button>
                <button
                    disabled={loading || metrics.length === 0}
                    type="submit"
                    className="px-5 py-1 rounded-2xl bg-yellow-500 text-neutral-950 font-bold text-lg hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/10 active:scale-95 disabled:opacity-50"
                >
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>
        </form >
    )
}

const MetricEditor = memo(function MetricEditor({
    metric,
    mIdx,
    updateMetric,
    removeMetric
}: {
    metric: Metric,
    mIdx: number,
    updateMetric: (u: Partial<Metric>) => void,
    removeMetric: () => void
}) {
    return (
        <div
            id={`metric-${metric.id}`}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-8 relative overflow-hidden group shadow-lg"
        >
            <div className="absolute top-0 left-0 w-2 h-full bg-yellow-500/50" />

            <div className="flex items-start justify-between">
                <div className="text-xs font-black text-neutral-700 tracking-widest mb-2 font-mono">Task_{mIdx + 1}</div>
                <button
                    type="button"
                    onClick={removeMetric}
                    className="text-neutral-600 hover:text-red-500 transition-colors p-2"
                >
                    <Trash2 className="h-5 w-5" />
                </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
                <div className="grid gap-2">
                    <label className="text-sm font-semibold text-neutral-400 tracking-wider">Task Descriptor</label>
                    <input
                        value={metric.name}
                        onChange={(e) => updateMetric({ name: e.target.value })}
                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-6 py-3 text-neutral-100 outline-none focus:ring-1 focus:ring-yellow-500 transition-all font-bold"
                        placeholder="e.g. Daily Walk"
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-semibold text-neutral-400 tracking-wider">Unit</label>
                    <input
                        value={metric.unit}
                        onChange={(e) => updateMetric({ unit: e.target.value })}
                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-6 py-3 text-neutral-100 outline-none focus:ring-1 focus:ring-yellow-500 transition-all"
                        placeholder="e.g. steps"
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-semibold text-neutral-400 tracking-wider">Input Type</label>
                    <select
                        value={metric.inputType}
                        onChange={(e) => {
                            const newType = e.target.value as MetricInputType;
                            const updates: Partial<Metric> = { inputType: newType };

                            if (newType === 'CHECKBOX') {
                                updates.aggregationMethod = 'SUM';
                                updates.maxPointsPerPeriod = null;
                                updates.maxPointsTotal = null;
                                // Reset to simple rule for checkbox
                                updates.scoringRules = [{
                                    comparisonType: 'GREATER_THAN_EQUAL',
                                    minValue: 1,
                                    maxValue: null,
                                    points: metric.scoringRules[0]?.points || 1,
                                }];
                            }
                            updateMetric(updates);
                        }}
                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-6 py-3 text-neutral-100 outline-none focus:ring-1 focus:ring-yellow-500 transition-all appearance-none"
                    >
                        <option value="NUMBER">Number</option>
                        <option value="CHECKBOX">Checkbox</option>
                        <option value="TEXT">Text</option>
                    </select>
                </div>

                {metric.inputType !== 'CHECKBOX' && (
                    <>
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-neutral-400 tracking-wider">Unit</label>
                            <input
                                value={metric.unit}
                                onChange={(e) => updateMetric({ unit: e.target.value })}
                                className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-6 py-3 text-neutral-100 outline-none focus:ring-1 focus:ring-yellow-500 transition-all"
                                placeholder="e.g. steps"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-neutral-400 tracking-wider">Aggregation</label>
                            <select
                                value={metric.aggregationMethod}
                                onChange={(e) => updateMetric({ aggregationMethod: e.target.value as AggregationMethod })}
                                className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-6 py-3 text-neutral-100 outline-none focus:ring-1 focus:ring-yellow-500 transition-all appearance-none"
                            >
                                <option value="SUM">SUM (Total logs)</option>
                                <option value="COUNT">COUNT (Number of logs)</option>
                                <option value="MAX">MAX (Highest log)</option>
                                <option value="MIN">MIN (Lowest log)</option>
                                <option value="AVERAGE">AVERAGE</option>
                            </select>
                        </div>
                    </>
                )}

                <div className="grid gap-2">
                    <label className="text-sm font-semibold text-neutral-400 tracking-wider">Frequency</label>
                    <select
                        value={metric.scoringFrequency}
                        onChange={(e) => updateMetric({ scoringFrequency: e.target.value as ScoringFrequency })}
                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-6 py-3 text-neutral-100 outline-none focus:ring-1 focus:ring-yellow-500 transition-all appearance-none"
                    >
                        <option value="DAILY">DAILY (Score per day)</option>
                        <option value="WEEKLY">WEEKLY (Score per week)</option>
                        <option value="MONTHLY">MONTHLY (Score per month)</option>
                    </select>
                </div>
            </div>


            {metric.inputType !== 'CHECKBOX' && (
                <div className="grid sm:grid-cols-2 gap-8 bg-neutral-950/50 p-6 rounded-2xl border border-neutral-800/50">
                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-neutral-500 flex items-center gap-2">
                            Cap for the Score Period
                        </label>
                        <input
                            type="number"
                            value={metric.maxPointsPerPeriod || ""}
                            onChange={(e) => updateMetric({ maxPointsPerPeriod: e.target.value ? parseFloat(e.target.value) : null })}
                            className="w-full bg-transparent border-b border-neutral-800 px-2 py-1 outline-none focus:border-yellow-500 transition-all text-neutral-200"
                            placeholder="Unlimited"
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-neutral-500">Cap for the Total Duration</label>
                        <input
                            type="number"
                            value={metric.maxPointsTotal || ""}
                            onChange={(e) => updateMetric({ maxPointsTotal: e.target.value ? parseFloat(e.target.value) : null })}
                            className="w-full bg-transparent border-b border-neutral-800 px-2 py-1 outline-none focus:border-yellow-500 transition-all text-neutral-200"
                            placeholder="Unlimited"
                        />
                    </div>
                </div>
            )}

            {metric.inputType === 'CHECKBOX' ? (
                <div className="space-y-4 pt-4 border-t border-neutral-800/50">
                    <h4 className="text-sm font-bold text-neutral-100">Scoring</h4>
                    <div className="grid gap-2">
                        <label className="text-xs font-bold text-neutral-500">Points per completion</label>
                        <input
                            type="number"
                            value={metric.scoringRules[0]?.points || 1}
                            onChange={(e) => {
                                updateMetric({
                                    scoringRules: [{
                                        comparisonType: 'GREATER_THAN_EQUAL',
                                        minValue: 1,
                                        maxValue: null,
                                        points: parseFloat(e.target.value) || 0,
                                        qualifierValue: 'NONE'
                                    }]
                                });
                            }}
                            className="w-32 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-yellow-500 font-black text-yellow-500"
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-4 pt-4 border-t border-neutral-800/50">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-neutral-100">Scoring Rules</h4>
                        <button
                            type="button"
                            onClick={() => updateMetric({
                                scoringRules: [...metric.scoringRules, {
                                    comparisonType: "RANGE",
                                    minValue: 0,
                                    maxValue: null,
                                    points: 1,
                                    qualifierValue: "NONE"
                                }]
                            })}
                            className="text-xs font-bold text-yellow-500 hover:text-yellow-400 transition-all px-3 py-1 rounded-lg border border-yellow-500/20 bg-yellow-500/5"
                        >
                            + Add Rule
                        </button>
                    </div>

                    <div className="space-y-3">
                        {metric.scoringRules.map((rule, rIdx) => (
                            <div key={rIdx} className="grid sm:grid-cols-5 gap-3 items-end bg-neutral-800/30 p-4 rounded-xl border border-neutral-800/50">
                                <div className="grid gap-1">
                                    <label className="text-[10px] font-bold text-neutral-500">Condition</label>
                                    <select
                                        value={rule.comparisonType}
                                        onChange={(e) => {
                                            const newRules = [...metric.scoringRules];
                                            newRules[rIdx].comparisonType = e.target.value as ComparisonType;
                                            updateMetric({ scoringRules: newRules });
                                        }}
                                        className="bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-yellow-500 text-neutral-200"
                                    >
                                        <option value="RANGE">Range (Min-Max)</option>
                                        <option value="GREATER_THAN_EQUAL">Min Score (&gt;=)</option>
                                        <option value="GREATER_THAN">Above (&gt;)</option>
                                    </select>
                                </div>
                                <div className="grid gap-1">
                                    <label className="text-[10px] font-bold text-neutral-500">Min</label>
                                    <input
                                        type="number"
                                        value={rule.minValue || ""}
                                        onChange={(e) => {
                                            const newRules = [...metric.scoringRules];
                                            newRules[rIdx].minValue = parseFloat(e.target.value);
                                            updateMetric({ scoringRules: newRules });
                                        }}
                                        className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-yellow-500 text-neutral-200"
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <label className="text-[10px] font-bold text-neutral-500">Max</label>
                                    <input
                                        type="number"
                                        disabled={rule.comparisonType !== "RANGE"}
                                        value={rule.maxValue || ""}
                                        onChange={(e) => {
                                            const newRules = [...metric.scoringRules];
                                            newRules[rIdx].maxValue = parseFloat(e.target.value);
                                            updateMetric({ scoringRules: newRules });
                                        }}
                                        className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-30 text-neutral-200"
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <label className="text-[10px] font-bold text-neutral-500">Points</label>
                                    <input
                                        type="number"
                                        value={rule.points}
                                        onChange={(e) => {
                                            const newRules = [...metric.scoringRules];
                                            newRules[rIdx].points = parseFloat(e.target.value);
                                            updateMetric({ scoringRules: newRules });
                                        }}
                                        className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-yellow-500 font-black text-yellow-500"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newRules = metric.scoringRules.filter((_, i) => i !== rIdx);
                                        updateMetric({ scoringRules: newRules });
                                    }}
                                    className="text-neutral-600 hover:text-red-500 p-2 ml-auto transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
})
