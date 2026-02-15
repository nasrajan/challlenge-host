'use client'

import { signOut } from "next-auth/react"
import { Trophy, LogOut } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function SignOutConfirm() {
    const [loading, setLoading] = useState(false)

    const handleSignOut = async () => {
        setLoading(true)
        await signOut({ callbackUrl: "/" })
    }

    return (
        <>
            <div className="flex flex-col items-center">
                <Link href="/" className="mb-6 flex items-center">
                    <Trophy className="h-8 w-8 text-yellow-500 mr-2" />
                    <span className="text-2xl font-bold text-neutral-100">ChallengeForge</span>
                </Link>
                <h2 className="text-center text-3xl font-bold tracking-tight text-neutral-100">
                    Sign out
                </h2>
                <p className="mt-2 text-center text-sm text-neutral-400">
                    Are you sure you want to sign out?
                </p>
            </div>

            <div className="mt-8 space-y-6 bg-neutral-900 px-6 py-8 shadow sm:rounded-lg border border-neutral-800">
                <button
                    onClick={handleSignOut}
                    disabled={loading}
                    className="flex w-full justify-center items-center gap-2 rounded-md bg-yellow-500 px-3 py-2 text-sm font-semibold text-neutral-950 hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500 disabled:opacity-50 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    {loading ? 'Signing out...' : 'Sign out'}
                </button>

                <div className="text-center">
                    <button
                        onClick={() => window.history.back()}
                        className="text-sm font-medium text-neutral-500 hover:text-neutral-300 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </>
    )
}
