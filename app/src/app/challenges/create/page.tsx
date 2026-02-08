'use client'

import { Trophy } from "lucide-react"
import ChallengeForm from "@/app/components/Admin/ChallengeForm"

export default function CreateChallengePage() {
    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 border-b border-neutral-800 pb-8">
                    <h1 className="text-4xl font-bold flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/10 rounded-2xl">
                            <Trophy className="h-10 w-10 text-yellow-500" />
                        </div>
                        Design Your Challenge
                    </h1>
                    <p className="text-neutral-400 mt-4 text-lg">Create a robust scoring system with multiple metrics, rules, and caps.</p>
                </header>

                <ChallengeForm mode="CREATE" />
            </div>
        </div>
    )
}
