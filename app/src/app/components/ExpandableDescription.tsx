'use client'

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

export default function ExpandableDescription({ description }: { description: string }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const isLong = description.length > 300 // Heuristic for long description

    if (!isLong) {
        return (
            <p className="text-xl text-neutral-400 mb-8 max-w-2xl leading-relaxed whitespace-pre-wrap break-words">
                {description}
            </p>
        )
    }

    return (
        <div className="mb-8 max-w-2xl">
            <div className={`relative ${!isExpanded ? 'max-h-32 overflow-hidden' : ''} transition-all duration-300 ease-in-out`}>
                <p className="text-xl text-neutral-400 leading-relaxed whitespace-pre-wrap break-words">
                    {description}
                </p>
                {!isExpanded && (
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-900 to-transparent" />
                )}
            </div>

            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-yellow-500 font-bold text-sm flex items-center gap-1 hover:text-yellow-400 transition-colors"
            >
                {isExpanded ? (
                    <>Show Less <ChevronUp className="h-4 w-4" /></>
                ) : (
                    <>Read More <ChevronDown className="h-4 w-4" /></>
                )}
            </button>
        </div>
    )
}
