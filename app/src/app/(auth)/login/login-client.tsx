'use client'

import { signIn, getSession } from "next-auth/react"
import { Trophy, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import Alert from "../../components/Alert"

export default function LoginClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const registered = searchParams.get("registered")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [show, setShow] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        try {
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
            })

            if (result?.error) {
                setError("Invalid email or password")
            } else {
                // Fetch session to get role and redirect accordingly
                const session = await getSession()
                const redirectUrl = session?.user?.role === 'ADMIN' ? '/admin' : '/dashboard'
                router.push(redirectUrl)
                router.refresh()
            }
        } catch (error) {
            setError("An error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true)
        try {
            await signIn("google", { callbackUrl: "/dashboard" })
        } catch (error) {
            setError("An error occurred with Google Sign In.")
        } finally {
            setGoogleLoading(false)
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
                    Sign in to your account
                </h2>
                <p className="mt-2 text-center text-sm text-neutral-400">
                    Or{' '}
                    <Link href="/register" className="font-medium text-yellow-500 hover:text-yellow-400">
                        create a new account
                    </Link>
                </p>
            </div>

            {registered && (
                <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-2 rounded text-sm text-center">
                    Account created! Please sign in.
                </div>
            )}

            <div className="mt-8 space-y-6 bg-neutral-900 px-6 py-8 shadow sm:rounded-lg border border-neutral-800">
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="flex w-full items-center justify-center gap-3 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm font-semibold text-neutral-100 hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 disabled:opacity-50"
                >
                    <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                        <path
                            d="M12.0003 20.45c4.6667 0 7.9167-3.2307 7.9167-7.9167 0-.75-.0833-1.5-.2083-2.125h-7.7084v4.0417h4.4167c-.2083 1.25-.9167 2.3333-2 3.0416l3.2083 2.5c1.875-1.75 2.9583-4.3333 2.9583-7.25 0-1.8333-.4583-3.5833-1.2916-5.125l-3.3334 2.5833c.8333.625 1.4583 1.5 1.7083 2.5417H12.0003v4.0417h4.4167c-1.3333 3.6666-4.9167 6.25-9.0833 6.25-4.5417 0-8.2917-3.0417-9.5417-7.25l-3.0833 2.4167c2.0833 4.125 6.375 6.9583 11.2083 6.9583z"
                            fill="currentColor"
                        />
                        <path
                            d="M12.0003 3.55c2.4167 0 4.5833.875 6.2917 2.3333l3.0833-3.0833C19.0427 1.0833 15.667 0 12.0003 0 7.167 0 2.875 2.8333.792 6.9583l3.0833 2.4167c1.25-4.2083 5-7.25 9.5417-7.25z"
                            fill="#EA4335"
                        />
                    </svg>
                    <span className="text-sm font-semibold leading-6">Google</span>
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-neutral-900 px-2 text-neutral-400">Or continue with</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Alert type="error" message={error} />
                    <div className="space-y-4">
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
                                    className="block w-full rounded-md border-0 bg-neutral-800 px-4 py-1.5 text-neutral-100 shadow-sm ring-1 ring-inset ring-neutral-700 placeholder:text-neutral-500 focus:ring-2 focus:ring-inset focus:ring-yellow-500 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium leading-6 text-neutral-300">
                                Password
                            </label>
                            <div className="mt-2">
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={show ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        className="block w-full rounded-md border-0 bg-neutral-800 px-4 py-1.5 text-neutral-100 shadow-sm ring-1 ring-inset ring-neutral-700 placeholder:text-neutral-500 focus:ring-2 focus:ring-inset focus:ring-yellow-500 sm:text-sm sm:leading-6"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShow(!show)}
                                    >
                                        {show ? <EyeOff className="h-5 w-5 text-neutral-400" /> : <Eye className="h-5 w-5 text-neutral-400" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <Link href="/forgot-password" className="font-medium text-yellow-500 hover:text-yellow-400">
                                Forgot your password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full justify-center rounded-md bg-yellow-500 px-3 py-2 text-sm font-semibold text-neutral-950 hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500 disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
            </div>
        </>
    )
}
