// Helpers for DP division payment schedules (months / quarters / years).
import type { PayUnit } from '@/assets/classes/commission'

// How many calendar months one payment step covers.
export const UNIT_MONTHS: Record<PayUnit, number> = { months: 1, quarters: 3, years: 12 }

// "2026-01-31" + 1 month = "2026-02-28" (day is clamped to the month's last day).
// Works on plain YYYY-MM-DD strings so there are no timezone shifts.
export function addMonthsClamped(date: string, months: number): string {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number)
  const target = new Date(Date.UTC(y, m - 1 + months, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(d, lastDay))
  return target.toISOString().slice(0, 10)
}

// Due date of payment number `index` (0 = the first payment, due on the start date).
export function dueDateAt(start: string, unit: PayUnit, index: number): string {
  return addMonthsClamped(start, index * UNIT_MONTHS[unit])
}

// Due date of the last payment of a division.
export function lastDueDate(start: string, unit: PayUnit, count: number): string {
  return dueDateAt(start, unit, count - 1)
}
