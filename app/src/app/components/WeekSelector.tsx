'use client'

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Calendar, ChevronDown, Check } from "lucide-react"

interface Week {
    number: number
    label: string
    start: Date
    end: Date
}

interface WeekSelectorProps {
    weeks: Week[]
}

export default function WeekSelector({ weeks }: WeekSelectorProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentWeekVal = searchParams.get('week') || 'all'
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Find the current selected week object for display
    const selectedWeek = weeks.find(w => w.number.toString() === currentWeekVal)
    const displayLabel = currentWeekVal === 'all'
        ? 'All Time'
        : `Week ${currentWeekVal} (${selectedWeek?.label})`

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (val: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (val === 'all') {
            params.delete('week')
        } else {
            params.set('week', val)
        }
        router.push(`?${params.toString()}`, { scroll: false })
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-2xl hover:bg-neutral-800 transition-colors group cursor-pointer"
            >
                <Calendar className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-bold text-neutral-300 group-hover:text-white transition-colors">
                    {displayLabel}
                </span>
                <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-max min-w-[200px] max-w-[300px] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-2">
                        <button
                            onClick={() => handleSelect('all')}
                            className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center justify-between hover:bg-neutral-800 transition-colors ${currentWeekVal === 'all' ? 'text-yellow-500 bg-yellow-500/5' : 'text-neutral-400'
                                }`}
                        >
                            All Time
                            {currentWeekVal === 'all' && <Check className="h-4 w-4" />}
                        </button>
                        <div className="h-px bg-neutral-800 mx-2" />
                        <div className="max-h-[300px] overflow-y-auto">
                            {weeks.map((week) => (
                                <button
                                    key={week.number}
                                    onClick={() => handleSelect(week.number.toString())}
                                    className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center justify-between hover:bg-neutral-800 transition-colors ${currentWeekVal === week.number.toString() ? 'text-yellow-500 bg-yellow-500/5' : 'text-neutral-400'
                                        }`}
                                >
                                    <div className="flex flex-col">
                                        <span>Week {week.number}</span>
                                        <span className="text-[10px] text-neutral-500 font-medium">{week.label}</span>
                                    </div>
                                    {currentWeekVal === week.number.toString() && <Check className="h-4 w-4" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
