'use client'

import { promoteToAdmin } from "@/app/actions/admin"
import { useState } from "react"

export default function SetupPage() {
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")

    const handlePromote = async (e: React.FormEvent) => {
        e.preventDefault()
        const res = await promoteToAdmin(email)
        if (res.success) {
            setMessage(`Successfully promoted ${email} to ADMIN`)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-8">
                <h1 className="text-2xl font-bold mb-4">Initial Admin Setup</h1>
                <p className="text-neutral-400 text-sm mb-6">
                    Enter the email of the user you want to promote to ADMIN.
                    This page should be deleted after use.
                </p>
                <form onSubmit={handlePromote} className="space-y-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full bg-neutral-800 border border-neutral-700 rounded px-4 py-2 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-yellow-500 text-neutral-950 font-bold py-2 rounded hover:bg-yellow-400 transition-colors"
                    >
                        Promote to Admin
                    </button>
                </form>
                {message && <p className="mt-4 text-green-500 text-sm">{message}</p>}
            </div>
        </div>
    )
}
