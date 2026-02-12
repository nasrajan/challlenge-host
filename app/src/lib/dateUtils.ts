export function toLocalISOString(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function toLocaleDisplayDate(date: Date | string): string {
    return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
}

import { fromZonedTime } from 'date-fns-tz';

export function parseAsPST(dateString: string): Date {
    return parseDateInTimezone(dateString);
}

export function parseDateInTimezone(dateString: string, timeZone: string = 'America/Los_Angeles'): Date {
    if (!dateString) return new Date();
    // Parse "YYYY-MM-DD" as midnight in the specified timezone
    // appending T00:00:00 to ensure we target start of day
    return fromZonedTime(`${dateString}T00:00:00`, timeZone);
}
