'use client'

import { resetPassword } from "@/app/actions/reset-password"
import { Trophy } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

export default function ResetPasswordClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    if (!token) {
        return (
            <div className="flex flex-col items-center">
                <h2 className="text-xl font-bold text-red-500">Invalid Link</h2>
                <p className="text-neutral-400 mt-2">Missing reset token.</p>
                <Link href="/login" className="mt-4 text-yellow-500 hover:underline">Go to Login</Link>
            </div>
        )
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        // Append token to formData
        formData.append('token', token as string);

        const result = await resetPassword(formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            router.push("/login?reset=true")
        }
    }

    return (
        <>
            <div className="flex flex-col items-center">
                <Link href="/" className="mb-6 flex items-center">
                    <Trophy className="h-8 w-8 text-yellow-500 mr-2" />
                    <span className="text-2xl font-bold text-neutral-100">ChallengeForge</span>
                </Link>
                <h2 className="text-center text-3xl font-bold tracking-tight text-neutral-100">
                    Set new password
                </h2>
            </div>

            <div className="mt-8 space-y-6 bg-neutral-900 px-6 py-8 shadow sm:rounded-lg border border-neutral-800">

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded text-sm mb-4">
                        {error}
                    </div>
                )}

                <form action={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium leading-6 text-neutral-300">
                            New Password
                        </label>
                        <div className="mt-2">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                className="block w-full rounded-md border-0 bg-neutral-800 px-4 py-1.5 text-neutral-100 shadow-sm ring-1 ring-inset ring-neutral-700 placeholder:text-neutral-500 focus:ring-2 focus:ring-inset focus:ring-yellow-500 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-neutral-300">
                            Confirm Password
                        </label>
                        <div className="mt-2">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                minLength={6}
                                className="block w-full rounded-md border-0 bg-neutral-800 px-4 py-1.5 text-neutral-100 shadow-sm ring-1 ring-inset ring-neutral-700 placeholder:text-neutral-500 focus:ring-2 focus:ring-inset focus:ring-yellow-500 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full justify-center rounded-md bg-yellow-500 px-3 py-2 text-sm font-semibold text-neutral-950 hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500 disabled:opacity-50"
                    >
                        {loading ? 'Reseting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </>
    )
}
