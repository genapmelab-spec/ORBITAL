export const MINUTE = 60
export const HOUR = 3600
export const DAY = 86400
export const YEAR = 3.15576e7

const group = (n: number, digits = 0) =>
  n.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits })

/** Compact, honest rendering of a duration in seconds. */
export function formatLookback(seconds: number): string {
  if (seconds < 10) return `${seconds.toFixed(2)} s`
  if (seconds < MINUTE) return `${seconds.toFixed(1)} s`
  if (seconds < HOUR) {
    const m = Math.floor(seconds / MINUTE)
    const s = Math.round(seconds - m * MINUTE)
    return `${m} m ${String(s).padStart(2, '0')} s`
  }
  if (seconds < DAY) return `${(seconds / HOUR).toFixed(1)} h`
  const years = seconds / YEAR
  if (years < 1) return `${(seconds / DAY).toFixed(1)} d`
  if (years < 1e6) return `${group(years)} y`
  if (years < 1e9) return `${(years / 1e6).toFixed(2)} M y`
  return `${(years / 1e9).toFixed(2)} G y`
}

/** The same value spelled out for screen readers. */
export function spokenLookback(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(2)} seconds`
  if (seconds < HOUR) return `${Math.round(seconds / MINUTE)} minutes`
  if (seconds < DAY) return `${(seconds / HOUR).toFixed(1)} hours`
  const years = seconds / YEAR
  // Mirror the visible formatter: below a year it counts days, not an
  // unrounded "0 years".
  if (years < 1) return `${(seconds / DAY).toFixed(1)} days`
  if (years < 1e3) return `${Math.round(years)} years`
  if (years < 1e6) return `${group(years / 1e3)} thousand years`
  if (years < 1e9) return `${(years / 1e6).toFixed(1)} million years`
  return `${(years / 1e9).toFixed(1)} billion years`
}

export function formatMoment(date: Date, withTime = true): string {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  })
}

export function formatMomentTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}
