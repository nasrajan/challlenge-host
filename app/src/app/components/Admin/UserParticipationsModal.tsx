"use client"

import { useEffect, useState, useTransition } from "react"
import { X, Trash2, Loader2, AlertCircle } from "lucide-react"
import { getUserParticipations, removeParticipant } from "@/app/actions/admin"
import DateDisplay from "@/app/components/DateDisplay"
import SuccessAlert from "@/app/components/SuccessAlert"
import ConfirmationModal from "@/app/components/ConfirmationModal"

interface UserParticipationsModalProps {
    userId: string
    userName: string
    isOpen: boolean
    onClose: () => void
}

export default function UserParticipationsModal({ userId, userName, isOpen, onClose }: UserParticipationsModalProps) {
    const [participations, setParticipations] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [isRemoving, startTransition] = useTransition()
    const [participantToRemove, setParticipantToRemove] = useState<{ id: string, name: string } | null>(null)

    useEffect(() => {
        if (isOpen) {
            loadParticipations()
            setSuccessMessage(null)
        }
    }, [isOpen, userId])

    async function loadParticipations() {
        setIsLoading(true)
        setError(null)
        try {
            const data = await getUserParticipations(userId)
            setParticipations(data)
        } catch (err) {
            setError("Failed to load participations")
        } finally {
            setIsLoading(false)
        }
    }

    function handleRemove(participantId: string, challengeName: string) {
        setParticipantToRemove({ id: participantId, name: challengeName })
    }

    async function confirmRemove() {
        if (!participantToRemove) return

        setSuccessMessage(null)
        startTransition(async () => {
            try {
                const result = await removeParticipant(participantToRemove.id)
                if (result.success) {
                    setParticipations(prev => prev.filter(p => p.id !== participantToRemove.id))
                    setSuccessMessage(result.message || "Participant removed successfully.")
                    setTimeout(() => setSuccessMessage(null), 5000)
                }
            } catch (err) {
                alert("Failed to remove participant")
            } finally {
                setParticipantToRemove(null)
            }
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Challenge Participations</h2>
                        <p className="text-neutral-500 font-medium">Joined challenges for <span className="text-blue-400 font-bold">{userName}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-500 hover:text-white transition-all"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-[300px]">
                    <SuccessAlert message={successMessage} className="mb-4" />
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-neutral-500">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <p className="font-bold">Fetching records...</p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-red-500">
                            <AlertCircle className="h-8 w-8" />
                            <p className="font-bold">{error}</p>
                        </div>
                    ) : participations.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-2">
                            <p className="font-bold">No active participations found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {participations.map((p) => (
                                <div key={p.id} className="bg-neutral-800/50 border border-neutral-700/50 p-6 rounded-2xl flex items-center justify-between group hover:border-blue-500/50 transition-all">
                                    <div className="grid gap-1">
                                        <div className="font-black text-lg text-neutral-100 italic tracking-tighter group-hover:text-blue-400 transition-colors">
                                            {p.challenge.name}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-neutral-500">
                                            <span>Name: {p.name}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] ${p.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                                }`}>
                                                {p.status}
                                            </span>
                                            <span>Joined: <DateDisplay date={p.joinedAt} /></span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(p.id, p.challenge.name)}
                                        disabled={isRemoving}
                                        className="p-3 bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 rounded-xl transition-all disabled:opacity-50"
                                        title="Remove from challenge"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pt-8 mt-4 border-t border-neutral-800">
                    <button
                        onClick={onClose}
                        className="w-full bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-4 rounded-xl font-bold transition-all"
                    >
                        Close Details
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!participantToRemove}
                onClose={() => setParticipantToRemove(null)}
                onConfirm={confirmRemove}
                title="Remove Participant"
                message={`Are you sure you want to remove ${userName} from the challenge "${participantToRemove?.name}"?`}
                confirmText="Remove Participant"
                isPending={isRemoving}
            />
        </div>
    )
}
