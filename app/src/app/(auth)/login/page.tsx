import { Suspense } from "react"
import LoginClient from "./login-client"

function LoginFallback() {
    return (
        <div className="flex flex-col items-center animate-pulse">
            <div className="mb-6 flex items-center">
                <div className="h-8 w-8 bg-neutral-700 rounded mr-2" />
                <div className="h-6 w-32 bg-neutral-700 rounded" />
            </div>
            <div className="h-8 w-64 bg-neutral-700 rounded mb-4" />
            <div className="h-4 w-48 bg-neutral-800 rounded" />
            <div className="mt-8 w-full max-w-sm bg-neutral-900 px-6 py-8 rounded-lg border border-neutral-800">
                <div className="h-10 bg-neutral-800 rounded mb-6" />
                <div className="h-10 bg-neutral-800 rounded mb-4" />
                <div className="h-10 bg-neutral-800 rounded mb-4" />
                <div className="h-10 bg-yellow-500/50 rounded" />
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoginClient />
        </Suspense>
    )
}

