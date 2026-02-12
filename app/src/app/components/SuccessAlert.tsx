"use client"

import { ReactNode } from "react"

interface SuccessAlertProps {
    message: string | ReactNode
    className?: string
}

export default function SuccessAlert({ message, className = "" }: SuccessAlertProps) {
    if (!message) return null

    return (
        <div className={`p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${className}`}>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-bold">{message}</span>
        </div>
    )
}
