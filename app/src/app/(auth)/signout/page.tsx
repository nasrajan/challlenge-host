import { Suspense } from "react"
import SignOutConfirm from "./signout-confirm"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Sign Out - Challenge.io",
    description: "Sign out of your account",
}

export default function SignOutPage() {
    return (
        <Suspense>
            <SignOutConfirm />
        </Suspense>
    )
}
