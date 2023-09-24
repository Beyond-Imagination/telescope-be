export function getDaysBefore(daysBefore: number): Date {
    const date = new Date()
    date.setDate(date.getDate() - daysBefore)
    return date
}

export function getMonthsBefore(monthsBefore: number): Date {
    const date = new Date()
    date.setMonth(date.getMonth() - monthsBefore)
    return date
}
