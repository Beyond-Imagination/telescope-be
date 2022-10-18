export function stringToDate(date: string): Date {
    const parts = date.split('-')
    return new Date(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]))
}

export function dateToString(date: Date): string {
    const timezoneOffset = date.getTimezoneOffset()
    date = new Date(date.getTime() - timezoneOffset * 60 * 1000)
    return date.toISOString().split('T')[0]
}

export const ONE_DAY_MSEC = 24 * 3600 * 1000
