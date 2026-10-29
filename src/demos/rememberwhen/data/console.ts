// Residents enrolled at Cedar Hollow, for the care console. Invented. Anchors are computed:
// the median of the first four sessions that have the measure, fixed once set.

import { RESIDENT } from './resident'
import { SESSIONS } from './sessions'
import type { ConsoleResident } from './types'

function anchorOf(values: (number | null)[]): number | null {
  const first = values.filter((v): v is number => v !== null).slice(0, 4)
  if (first.length < 4) return null
  const s = [...first].sort((a, b) => a - b)
  return (s[1] + s[2]) / 2
}

type Row = Omit<ConsoleResident, 'anchors'>

const nellSessions = SESSIONS.filter((s) => s.status !== 'failed').slice(-8)

const ROWS: Row[] = [
  {
    id: RESIDENT.id,
    first_name: RESIDENT.first_name,
    last_name: RESIDENT.last_name,
    room_number: RESIDENT.room_number,
    unit_name: RESIDENT.unit_name,
    care_level: RESIDENT.care_level,
    assignee: RESIDENT.assignee.full_name,
    sessions: SESSIONS.filter((s) => s.status !== 'failed').length,
    call_length: nellSessions.map((s) => s.duration_seconds),
    warmth: [0.082, 0.078, 0.085, 0.08, 0.083, 0.079, 0.081, 0.086],
    threads_open: 2,
    threads_acknowledged: 1,
    yearnings_open: 3,
  },
  // On Watch: both measures below 80% of the anchor for the last two sessions.
  { id: 'res-leonard', first_name: 'Leonard', last_name: 'Haugen', room_number: '104', unit_name: 'The Birches', care_level: 'assisted', assignee: 'Priya Raman', sessions: 19, call_length: [900, 860, 950, 880, 820, 640, 600, 580], warmth: [0.08, 0.075, 0.085, 0.07, 0.07, 0.05, 0.045, 0.04], threads_open: 1, threads_acknowledged: 1, yearnings_open: 1 },
  { id: 'res-frances', first_name: 'Frances', last_name: 'Duquette', room_number: '208B', unit_name: 'Willow Court', care_level: 'memory_care', assignee: 'Marcus Bell', sessions: 9, call_length: [700, 760, 720, 680, 520, 500], warmth: [0.09, 0.1, 0.085, 0.095, 0.06, 0.055], threads_open: 2, threads_acknowledged: 0, yearnings_open: 2 },
  // Low on one measure only.
  { id: 'res-alma', first_name: 'Alma', last_name: 'Reyes', room_number: '131', unit_name: 'The Birches', care_level: 'independent', assignee: 'Priya Raman', sessions: 14, call_length: [1100, 1000, 1200, 1050, 800, 760, 780], warmth: [0.06, 0.065, 0.07, 0.06, 0.066, 0.064, 0.07], threads_open: 0, threads_acknowledged: 0, yearnings_open: 1 },
  { id: 'res-clifford', first_name: 'Clifford', last_name: 'Nakamura', room_number: '140', unit_name: 'The Birches', care_level: 'assisted', assignee: null, sessions: 22, call_length: [600, 640, 620, 610, 630, 650, 615, 640], warmth: [0.07, 0.072, 0.068, 0.075, 0.05, 0.048, 0.046, 0.05], threads_open: 1, threads_acknowledged: 0, yearnings_open: 0 },
  // Too few sessions for a baseline.
  { id: 'res-otto', first_name: 'Otto', last_name: 'Brenneman', room_number: '118B', unit_name: 'Willow Court', care_level: 'assisted', assignee: 'Marcus Bell', sessions: 3, call_length: [480, 510, 495], warmth: [0.05, 0.06, 0.055], threads_open: 0, threads_acknowledged: 0, yearnings_open: 0 },
  // A session where he spoke too little for warmth to be measured.
  { id: 'res-earl', first_name: 'Earl', last_name: 'Washington', room_number: '126', unit_name: 'The Birches', care_level: 'independent', assignee: 'Priya Raman', sessions: 11, call_length: [520, 540, 300, 530, 560, 550, 545], warmth: [0.06, 0.058, null, 0.062, 0.065, 0.06, 0.063], threads_open: 0, threads_acknowledged: 0, yearnings_open: 1 },
  // Steady.
  { id: 'res-bernice', first_name: 'Bernice', last_name: 'Kowalczyk', room_number: '109', unit_name: 'The Birches', care_level: 'assisted', assignee: 'Priya Raman', sessions: 24, call_length: [780, 820, 800, 760, 790, 810, 830, 805], warmth: [0.09, 0.088, 0.092, 0.087, 0.09, 0.093, 0.089, 0.091], threads_open: 1, threads_acknowledged: 1, yearnings_open: 2 },
  { id: 'res-vivian', first_name: 'Vivian', last_name: 'Ostrowski', room_number: '204', unit_name: 'Willow Court', care_level: 'memory_care', assignee: 'Marcus Bell', sessions: 16, call_length: [420, 450, 440, 430, 460, 445, 455], warmth: [0.075, 0.07, 0.072, 0.078, 0.074, 0.076, 0.073], threads_open: 0, threads_acknowledged: 0, yearnings_open: 0 },
  { id: 'res-mae', first_name: 'Mae', last_name: 'Corrigan', room_number: '137', unit_name: 'The Birches', care_level: 'independent', assignee: null, sessions: 7, call_length: [990, 1020, 960, 1010, 1000, 985], warmth: [0.1, 0.095, 0.105, 0.098, 0.1, 0.102], threads_open: 0, threads_acknowledged: 0, yearnings_open: 1 },
]

export const COMMUNITY_RESIDENTS: ConsoleResident[] = ROWS.map((r) => ({
  ...r,
  anchors: { call_length: anchorOf(r.call_length), warmth: anchorOf(r.warmth) },
}))
