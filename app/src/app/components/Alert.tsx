"use client"

import { ReactNode, useEffect, useRef } from "react"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"

interface AlertProps {
    type?: 'success' | 'error' | 'info'
    message: string | ReactNode
    className?: string
    scrollDisabled?: boolean
}

export default function Alert({
    type = 'info',
    message,
    className = "",
    scrollDisabled = false
}: AlertProps) {
    const alertRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!message || scrollDisabled) return

        // Smooth scroll the alert into view
        alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, [message, scrollDisabled])

    if (!message) return null

    const styles = {
        success: "bg-green-500/10 border-green-500/20 text-green-400",
        error: "bg-red-500/10 border-red-500/20 text-red-400",
        info: "bg-blue-500/10 border-blue-500/20 text-blue-400"
    }

    const icons = {
        success: <CheckCircle2 className="h-5 w-5 shrink-0" />,
        error: <AlertCircle className="h-5 w-5 shrink-0" />,
        info: <Info className="h-5 w-5 shrink-0" />
    }

    return (
        <div
            ref={alertRef}
            className={`p-4 border rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${styles[type]} ${className}`}
        >
            {icons[type]}
            <span className="text-sm font-bold">{message}</span>
        </div>
    )
}
