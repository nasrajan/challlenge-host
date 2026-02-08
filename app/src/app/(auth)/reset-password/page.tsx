import { Suspense } from "react"
import ResetPasswordClient from "./reset-password-client"

function ResetPasswordFallback() {
    return (
        <div className="flex flex-col items-center animate-pulse">
            <div className="mb-6 flex items-center">
                <div className="h-8 w-8 bg-neutral-700 rounded mr-2" />
                <div className="h-6 w-32 bg-neutral-700 rounded" />
            </div>
            <div className="h-8 w-48 bg-neutral-700 rounded mb-4" />
            <div className="mt-8 w-full max-w-sm bg-neutral-900 px-6 py-8 rounded-lg border border-neutral-800">
                <div className="h-10 bg-neutral-800 rounded mb-4" />
                <div className="h-10 bg-neutral-800 rounded mb-4" />
                <div className="h-10 bg-yellow-500/50 rounded" />
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<ResetPasswordFallback />}>
            <ResetPasswordClient />
        </Suspense>
    )
}
