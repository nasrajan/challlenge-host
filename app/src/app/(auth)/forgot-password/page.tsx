'use client'

import { requestPasswordReset } from "@/app/actions/forgot-password"
import { Trophy, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function ForgotPasswordPage() {
    const [status, setStatus] = useState<{ error?: string; success?: boolean; message?: string } | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setStatus(null)

        // Server Action
        const result = await requestPasswordReset(formData)

        setStatus(result)
        setLoading(false)
    }

    return (
        <>
            <div className="flex flex-col items-center">
                <Link href="/" className="mb-6 flex items-center">
                    <Trophy className="h-8 w-8 text-yellow-500 mr-2" />
                    <span className="text-2xl font-bold text-neutral-100">Challenge.io</span>
                </Link>
                <h2 className="text-center text-3xl font-bold tracking-tight text-neutral-100">
                    Reset your password
                </h2>
                <p className="mt-2 text-center text-sm text-neutral-400">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

            <div className="mt-8 space-y-6 bg-neutral-900 px-6 py-8 shadow sm:rounded-lg border border-neutral-800">
                {status?.success && (
                    <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-2 rounded text-sm mb-4">
                        {status.message}
                    </div>
                )}

                {status?.error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded text-sm mb-4">
                        {status.error}
                    </div>
                )}

                <form action={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium leading-6 text-neutral-300">
                            Email address
                        </label>
                        <div className="mt-2">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="block w-full rounded-md border-0 bg-neutral-800 py-1.5 text-neutral-100 shadow-sm ring-1 ring-inset ring-neutral-700 placeholder:text-neutral-500 focus:ring-2 focus:ring-inset focus:ring-yellow-500 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full justify-center rounded-md bg-yellow-500 px-3 py-2 text-sm font-semibold text-neutral-950 hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500 disabled:opacity-50"
                    >
                        {loading ? 'Sending link...' : 'Send reset link'}
                    </button>
                </form>

                <div className="flex justify-center">
                    <Link href="/login" className="flex items-center text-sm font-medium text-neutral-400 hover:text-neutral-300">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to sign in
                    </Link>
                </div>
            </div>
        </>
    )
}
