// The featured resident. Entirely fictional: name, community, family and life story are invented.

import type { Resident } from './types'

export const RESIDENT: Resident = {
  id: 'res-nell',
  display_name: 'Eleanor “Nell” Lindqvist',
  first_name: 'Nell',
  last_name: 'Lindqvist',
  room_number: '118',
  unit_name: 'The Birches',
  organization_name: 'Cedar Hollow Senior Living',
  care_level: 'assisted',
  birth_year: 1938,
  assignee: { full_name: 'Priya Raman', role_label: 'Community Staff', job_title: 'Life Enrichment Coordinator' },
}

/** Weeks of conversation history in the demo; week 1 starts on START_DATE. */
export const TOTAL_WEEKS = 30
export const CURRENT_WEEK = TOTAL_WEEKS
/** ISO Monday of week 1 (ISO 2026-W14). */
export const START_DATE = '2026-03-30'

/** ISO week label for a demo week: week 1 is 2026-W14. */
export function isoWeekLabel(week: number) {
  return `2026-W${String(13 + week).padStart(2, '0')}`
}

/** Calendar date (ISO) of a weekday in a demo week; weekday 0 = Monday. */
export function dateInWeek(week: number, weekday = 2) {
  const d = new Date(`${START_DATE}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + (week - 1) * 7 + weekday)
  return d.toISOString().slice(0, 10)
}
