'use client'

import { createChallenge, updateChallenge } from "@/app/actions/challenges"
import {
    Trophy,
    Calendar,
    Settings,
    BarChart,
    Plus,
    Trash2,
    Info
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
    AggregationMethod,
    ScoringFrequency,
    ComparisonType
} from "@prisma/client"

interface ScoringRule {
    comparisonType: ComparisonType;
    minValue: number | null;
    maxValue: number | null;
    points: number;
    qualifierValue: string;
}

interface Metric {
    id: string; // client-side only or DB id
    name: string;
    unit: string;
    aggregationMethod: AggregationMethod;
    scoringFrequency: ScoringFrequency;
    maxPointsPerPeriod: number | null;
    maxPointsTotal: number | null;
    qualifiers: { value: string }[];
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
        maxParticipants: number | null;
        metrics: any[];
    };
    mode: 'CREATE' | 'EDIT';
}

export default function ChallengeForm({ initialData, mode }: ChallengeFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Map initial metrics if they exist
    const defaultMetrics: Metric[] = initialData?.metrics.map(m => ({
        id: m.id || Math.random().toString(36).substr(2, 9),
        name: m.name,
        unit: m.unit,
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
        ]

    const [metrics, setMetrics] = useState<Metric[]>(defaultMetrics)

    const addMetric = () => {
        setMetrics([
            ...metrics,
            {
                id: Math.random().toString(36).substr(2, 9),
                name: "",
                unit: "",
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
    }

    const removeMetric = (id: string) => {
        setMetrics(metrics.filter(m => m.id !== id))
    }

    const updateMetric = (id: string, updates: Partial<Metric>) => {
        setMetrics(metrics.map(m => m.id === id ? { ...m, ...updates } : m))
    }

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

    const formatDateForInput = (date: Date) => {
        return new Date(date).toISOString().split('T')[0]
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
                    Mission Parameters
                </div>

                <div className="grid gap-8">
                    <div className="grid gap-2">
                        <label className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Mission Name</label>
                        <input
                            name="name"
                            required
                            defaultValue={initialData?.name}
                            className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-6 py-4 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none text-lg transition-all"
                            placeholder="e.g. Marathon of Kings"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Objective Description</label>
                        <textarea
                            name="description"
                            defaultValue={initialData?.description || ""}
                            className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-6 py-4 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none h-32 transition-all"
                            placeholder="Detail the mission objectives..."
                        />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-8">
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Start Window</label>
                            <input
                                name="startDate"
                                type="date"
                                required
                                defaultValue={initialData ? formatDateForInput(initialData.startDate) : ""}
                                className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-6 py-4 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">End Window</label>
                            <input
                                name="endDate"
                                type="date"
                                required
                                defaultValue={initialData ? formatDateForInput(initialData.endDate) : ""}
                                className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-6 py-4 text-neutral-100 focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Multi-Metric Config */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-2xl font-bold flex items-center gap-3 text-neutral-100">
                        <BarChart className="h-6 w-6 text-neutral-400" />
                        Scoring Core
                    </h2>
                    <button
                        type="button"
                        onClick={addMetric}
                        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 px-4 py-2 rounded-xl border border-neutral-700 transition-all font-semibold"
                    >
                        <Plus className="h-5 w-5" />
                        Add Metric
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
                    Abort Changes
                </button>
                <button
                    disabled={loading || metrics.length === 0}
                    type="submit"
                    className="px-10 py-4 rounded-2xl bg-yellow-500 text-neutral-950 font-bold text-lg hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/10 active:scale-95 disabled:opacity-50"
                >
                    {loading ? "Synchronizing..." : mode === 'EDIT' ? "Update Mission" : "Deploy Mission"}
                </button>
            </div>
        </form>
    )
}

function MetricEditor({
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
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-8 relative overflow-hidden group shadow-lg">
            <div className="absolute top-0 left-0 w-2 h-full bg-yellow-500/50" />

            <div className="flex items-start justify-between">
                <div className="text-xs font-black text-neutral-700 uppercase tracking-widest mb-2 font-mono">Metric_{mIdx + 1}</div>
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
                    <label className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Descriptor</label>
                    <input
                        value={metric.name}
                        onChange={(e) => updateMetric({ name: e.target.value })}
                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-6 py-3 text-neutral-100 outline-none focus:ring-1 focus:ring-yellow-500 transition-all font-bold"
                        placeholder="e.g. Daily Walk"
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Unit</label>
                    <input
                        value={metric.unit}
                        onChange={(e) => updateMetric({ unit: e.target.value })}
                        className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-6 py-3 text-neutral-100 outline-none focus:ring-1 focus:ring-yellow-500 transition-all"
                        placeholder="e.g. steps"
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Aggregation</label>
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
                <div className="grid gap-2">
                    <label className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Frequency</label>
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

            <div className="grid sm:grid-cols-2 gap-8 bg-neutral-950/50 p-6 rounded-2xl border border-neutral-800/50">
                <div className="grid gap-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-2">
                        Window Cap (Period)
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
                    <label className="text-xs font-bold text-neutral-500 uppercase">Mission Cap (Total)</label>
                    <input
                        type="number"
                        value={metric.maxPointsTotal || ""}
                        onChange={(e) => updateMetric({ maxPointsTotal: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full bg-transparent border-b border-neutral-800 px-2 py-1 outline-none focus:border-yellow-500 transition-all text-neutral-200"
                        placeholder="Unlimited"
                    />
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-neutral-800/50">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-neutral-100 uppercase tracking-widest font-mono">Scoring_Rules</h4>
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
                                <label className="text-[10px] font-bold text-neutral-500 uppercase">Condition</label>
                                <select
                                    value={rule.comparisonType}
                                    onChange={(e) => {
                                        const newRules = [...metric.scoringRules];
                                        newRules[rIdx].comparisonType = e.target.value as ComparisonType;
                                        updateMetric({ scoringRules: newRules });
                                    }}
                                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-yellow-500 text-neutral-200"
                                >
                                    <option value="RANGE">RANGE (Min-Max)</option>
                                    <option value="GREATER_THAN_EQUAL">MIN THRESHOLD (&gt;=)</option>
                                    <option value="GREATER_THAN">ABOVE (&gt;)</option>
                                </select>
                            </div>
                            <div className="grid gap-1">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase">Min</label>
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
                                <label className="text-[10px] font-bold text-neutral-500 uppercase">Max</label>
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
                                <label className="text-[10px] font-bold text-neutral-500 uppercase">Points</label>
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
        </div>
    )
}
