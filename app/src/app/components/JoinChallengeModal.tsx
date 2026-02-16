"use client"

import { useState, useTransition } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import { joinChallenge } from "@/app/actions/challenges"
import { useRouter } from "next/navigation"

interface JoinChallengeModalProps {
    challengeId: string
    challengeName: string
    allowMultiParticipants: boolean
    isAlreadyParticipant?: boolean
}


export default function JoinChallengeModal({
    challengeId,
    challengeName,
    allowMultiParticipants,
    isAlreadyParticipant
}: JoinChallengeModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [names, setNames] = useState<string[]>([""])
    const [error, setError] = useState("")
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleAddName = () => {
        setNames([...names, ""])
    }

    const handleRemoveName = (index: number) => {
        if (names.length > 1) {
            const newNames = [...names]
            newNames.splice(index, 1)
            setNames(newNames)
        }
    }

    const handleNameChange = (index: number, value: string) => {
        const newNames = [...names]
        newNames[index] = value
        setNames(newNames)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        const filteredNames = names.map(n => n.trim()).filter(n => n !== "")
        if (filteredNames.length === 0) {
            setError("Please add at least one participant")
            return
        }

        for (const name of filteredNames) {
            if (name.length < 2) {
                setError(`Name "${name}" must be at least 2 characters`)
                return
            }
        }

        startTransition(async () => {
            try {
                await joinChallenge(challengeId, filteredNames)
                setIsOpen(false)
                setNames([""])
                router.refresh()
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to join challenge"
                setError(message)
            }
        })
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-yellow-500 text-neutral-950 px-8 py-3 rounded-2xl font-black hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/20 active:scale-95"
            >
                {isAlreadyParticipant ? "Add Another Participant" : "Join Challenge"}
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">{isAlreadyParticipant ? "Add Participant" : "Join Challenge"}</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-500 hover:text-white transition-all"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <p className="text-neutral-400 mb-6 font-medium">
                            {isAlreadyParticipant ? "Add one or more additional participants to " : "Join "}
                            <span className="text-yellow-500 font-bold">{challengeName}</span>.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest ml-1">
                                    Participants
                                </label>
                                {names.map((name, index) => (
                                    <div key={index} className="flex gap-2">
                                        <div className="relative flex-1 group">
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => handleNameChange(index, e.target.value)}
                                                placeholder={`Participant ${index + 1} name...`}
                                                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-all font-medium"
                                                autoFocus={index === names.length - 1}
                                                disabled={isPending}
                                            />
                                        </div>
                                        {names.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveName(index)}
                                                className="p-3 bg-neutral-800 hover:bg-red-500/20 text-neutral-500 hover:text-red-500 rounded-xl transition-all"
                                                disabled={isPending}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {allowMultiParticipants && (
                                    <button
                                        type="button"
                                        onClick={handleAddName}
                                        className="w-full py-3 border-2 border-dashed border-neutral-700 rounded-xl text-neutral-500 hover:text-white hover:border-neutral-500 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                                        disabled={isPending}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Another Participant
                                    </button>
                                )}

                                {error && (
                                    <p className="text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-1">{error}</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
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
                                    className="flex-[2] bg-yellow-500 hover:bg-yellow-400 text-neutral-950 px-6 py-3 rounded-xl font-black transition-all shadow-xl shadow-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isPending}
                                >
                                    {isPending ? (isAlreadyParticipant ? "Adding..." : "Joining...") : (isAlreadyParticipant ? "Add Participant" : "Join Challenge")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
