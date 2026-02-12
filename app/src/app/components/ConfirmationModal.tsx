"use client"

import { X, AlertTriangle, AlertCircle, Info } from "lucide-react"

interface ConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
    isPending?: boolean
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = 'danger',
    isPending = false
}: ConfirmationModalProps) {
    if (!isOpen) return null

    const variants = {
        danger: {
            icon: AlertTriangle,
            color: "text-red-500",
            bg: "bg-red-500/10",
            border: "border-red-500/20",
            button: "bg-red-500 hover:bg-red-400 text-white shadow-red-500/20"
        },
        warning: {
            icon: AlertTriangle,
            color: "text-yellow-500",
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/20",
            button: "bg-yellow-500 hover:bg-yellow-400 text-neutral-950 shadow-yellow-500/20"
        },
        info: {
            icon: Info,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            button: "bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20"
        }
    }

    const { icon: Icon, color, bg, border, button } = variants[variant]

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div
                className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-6">
                    <div className={`p-3 rounded-2xl ${bg} ${border}`}>
                        <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-500 hover:text-white transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                    <p className="text-neutral-400 text-sm leading-relaxed">{message}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="flex-1 px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm transition-all disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm()
                        }}
                        disabled={isPending}
                        className={`flex-1 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg disabled:opacity-50 ${button}`}
                    >
                        {isPending ? "Processing..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
