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
