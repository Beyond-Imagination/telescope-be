export function getDaysBefore(daysBefore: number): Date {
    const date = new Date()
    date.setDate(date.getDate() - daysBefore)
    return date
}
