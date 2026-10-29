// Memory growth by week, as the week strip shows it: how many people, events, places and
// organizations the graph held at the end of each week, and what each week added.

import { NODES } from '../data/graph'
import { START_DATE, TOTAL_WEEKS } from '../data/resident'

export interface WeekGrowth {
  week: number
  label: string // ISO week label, e.g. 2026-W07
  added: number
  cumulative: number
  added_prior: number | null
}

function isoWeekLabel(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const wk = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`
}

export function weekDate(week: number) {
  const d = new Date(`${START_DATE}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + (week - 1) * 7)
  return d
}

export const GROWTH: WeekGrowth[] = (() => {
  let cum = 0
  const out: WeekGrowth[] = []
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const added = NODES.filter((n) => n.first_seen_week === w).length
    cum += added
    out.push({ week: w, label: isoWeekLabel(weekDate(w)), added, cumulative: cum, added_prior: w === 1 ? null : out[w - 2].added })
  }
  return out
})()

export function fmtDate(iso: string | Date, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const d = typeof iso === 'string' ? new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso) : iso
  return d.toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' })
}

export function mmss(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
