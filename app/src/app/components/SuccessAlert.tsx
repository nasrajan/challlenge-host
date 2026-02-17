"use client"

import { ReactNode } from "react"
import Alert from "./Alert"

interface SuccessAlertProps {
    message: string | ReactNode
    className?: string
}

export default function SuccessAlert({ message, className = "" }: SuccessAlertProps) {
    return <Alert type="success" message={message} className={className} />
}
