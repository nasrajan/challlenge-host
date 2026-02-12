'use client'

import { useEffect, useState } from 'react'

export default function DateDisplay({ date, className }: { date: Date | string, className?: string }) {
    const [formattedDate, setFormattedDate] = useState<string>('')

    useEffect(() => {
        setFormattedDate(new Date(date).toLocaleDateString())
    }, [date])

    if (!formattedDate) {
        // Render a skeleton or empty span to avoid layout shift
        return <span className={`opacity-0 ${className}`}>Loading...</span>
    }

    return <span className={className}>{formattedDate}</span>
}
