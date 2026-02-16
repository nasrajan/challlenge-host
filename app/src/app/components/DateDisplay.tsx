'use client'

import { memo } from 'react'
import { toZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'

function DateDisplay({ date, className, timeZone = 'UTC' }: { date: Date | string, className?: string, timeZone?: string }) {
    if (!date) {
        return <span className={`opacity-0 ${className}`}>Loading...</span>
    }

    let formattedDate: string
    try {
        // Heuristic: If the date is exactly midnight UTC, it's likely a "Date Only" field (startDate/endDate).
        // In this case, we display the UTC date components to match the "Calendar Date" stored in DB.
        const isMidnightUTC = (d: Date | string) => {
            const dateObj = new Date(d)
            return dateObj.getUTCHours() === 0 && dateObj.getUTCMinutes() === 0 && dateObj.getUTCSeconds() === 0 && dateObj.getUTCMilliseconds() === 0
        }

        const targetTimeZone = isMidnightUTC(date) ? 'UTC' : timeZone
        const zonedDate = toZonedTime(date, targetTimeZone)
        formattedDate = format(zonedDate, 'M/d/yyyy')
    } catch (e) {
        console.error("Date formatting error", e)
        formattedDate = String(date)
    }

    if (!formattedDate) {
        return <span className={`opacity-0 ${className}`}>Loading...</span>
    }

    return <span className={className}>{formattedDate}</span>
}

export default memo(DateDisplay)
