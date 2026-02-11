"use client"

import { useState, useTransition } from "react"
import { X } from "lucide-react"
import { joinChallenge } from "@/app/actions/challenges"
import { useRouter } from "next/navigation"

interface JoinChallengeModalProps {
    challengeId: string
    challengeName: string
}

export default function JoinChallengeModal({ challengeId, challengeName }: JoinChallengeModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [displayName, setDisplayName] = useState("")
    const [error, setError] = useState("")
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (displayName.trim().length < 2) {
            setError("Display name must be at least 2 characters")
            return
        }

        if (displayName.trim().length > 50) {
            setError("Display name must be 50 characters or less")
            return
        }

        startTransition(async () => {
            try {
                await joinChallenge(challengeId, displayName)
                setIsOpen(false)
                router.refresh()
            } catch (err: any) {
                setError(err.message || "Failed to join challenge")
            }
        })
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-yellow-500 text-neutral-950 px-8 py-3 rounded-2xl font-black hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/20 active:scale-95"
            >
                Join the Challenge
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Join Challenge</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-500 hover:text-white transition-all"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <p className="text-neutral-400 mb-6">
                            You're about to join <span className="text-yellow-500 font-bold">{challengeName}</span>.
                            Choose a display name that will appear on the leaderboard.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-sm font-semibold text-neutral-400 mb-2 block">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Enter your display name..."
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                                    autoFocus
                                    disabled={isPending}
                                />
                                <p className="text-xs text-neutral-500 mt-2">
                                    {displayName.length}/50 characters
                                </p>
                                {error && (
                                    <p className="text-red-500 text-sm mt-2">{error}</p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
                                    disabled={isPending}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 px-6 py-3 rounded-xl font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isPending}
                                >
                                    {isPending ? "Joining..." : "Join Challenge"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
