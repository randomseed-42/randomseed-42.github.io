// Data shapes for the Remember When mock. They follow the real API payloads (call replay,
// turns, extraction events, graph view, life chapters, biosketch, signal threads, moments,
// care console) closely enough that the views read the same way; all content is invented.

export type EntityKind = 'person' | 'event' | 'place' | 'organization'
export type Predicate =
  | 'has_spouse'
  | 'has_parent'
  | 'has_child'
  | 'has_sibling'
  | 'has_relative'
  | 'has_friend'
  | 'knows'
  | 'works_at'
  | 'member_of'
  | 'attended_school'
  | 'attended'
  | 'participated_in'
  | 'lives_in'
  | 'born_in'
  | 'died_in'
  | 'related_to'
  | 'co_mentioned'

export interface Resident {
  id: string
  display_name: string
  first_name: string
  last_name: string
  room_number: string
  unit_name: string
  organization_name: string
  care_level: 'independent' | 'assisted' | 'memory_care'
  birth_year: number
  assignee: { full_name: string; role_label: string; job_title: string }
}

/** Week 1 is the resident's first conversation week; the demo spans `TOTAL_WEEKS`. */
export interface GraphNode {
  name: string // lowercase key
  display_name: string
  kind: EntityKind
  /** Relation phrases to the resident, e.g. "has_child" (her child), "has_parent". Empty if indirect. */
  relation_to_holder: Predicate[]
  year: number | null
  chapter: string | null // Chapter.id
  discussed_count: number
  first_seen_week: number
  /** One stored fact about this node, as an extraction would phrase it. */
  fact: string
}

export interface GraphEdge {
  source: string
  target: string
  predicate: Predicate
  fact?: string
}

export interface Chapter {
  id: string
  name: string
  start_year: number
  end_year: number
  status: 'confirmed' | 'proposed'
  narrative_summary: string
  start_anchor?: string // node name
  end_anchor?: string
}

export interface Session {
  number: number
  call_id: string
  date: string // ISO date
  week: number
  title: string
  duration_seconds: number
  status: 'completed' | 'ended' | 'failed' | 'initiated'
  summary: string
  memories_added: number
  replayable: boolean
}

export interface Turn {
  seq: number
  role: 'user' | 'assistant' // user = resident, assistant = Andrew
  text: string
  offset_ms: number
}

export interface ExtractionEvent {
  kind: 'captured' | 'recalled' | 'signal'
  label: string
  note?: string // recalled: what Andrew said back; signal: resident's exact words
  predicate?: Predicate | string
  entities: { name: string; kind: EntityKind; novelty: 'new' | 'matched' }[]
  created_entity: boolean
  message_seq: number
}

export interface CallDetail {
  call_id: string
  turns: Turn[]
  events: ExtractionEvent[]
}

// ---------------------------------------------------------------- biosketch

export interface StartWith {
  facet: 'want' | 'hope' | 'nostalgia'
  label: string
  detail: string
  quote: string
  mentions: number
}

export interface GuidanceItem {
  kind: 'communication' | 'preference' | 'tone' | 'emotional_state' | 'steer_around'
  text: string
  status: 'proposed' | 'active'
  by_resident: boolean
}

export interface SignalThread {
  id: string
  signal_type: 'request' | 'concern'
  category: string
  state: 'open' | 'raised_again' | 'resident_reports_resolved' | 'quiet'
  raised_at: string
  state_changed_at: string
  acknowledged: boolean
  label: string
  quote: string
  try: { text: string; domain: 'comfort' | 'environment' | 'routine' | 'company' }
}

export interface Moment {
  id: string
  facet: 'want' | 'hope' | 'nostalgia'
  label: string
  quote: string
  status: 'open' | 'acknowledged' | 'done'
  created_at: string
}

export interface BiosketchContent {
  start_with: StartWith[]
  since_last_week: {
    this: { date: string; seconds: number; memories: number }
    previous: { date: string; seconds: number; memories: number }
    headline: string
    quote: string
  }
  talking_about: { label: string; date: string; type: 'headline' | 'fact' }[]
  community_approach: string
  guidance: GuidanceItem[]
  threads: SignalThread[]
  moments: Moment[]
  trend: { week_label: string; sessions: number; seconds: number; memories_added: number }[]
  /** Non-clinical only: hearing, communication aids, preferences. No diagnosis or scores. */
  baseline: { label: string; detail: string }[]
  briefing: { text: string; source: 'header' | 'do_not_raise' | 'start_with' | 'since_last_week' | 'who_she_is' | 'footer' }[]
}

// ---------------------------------------------------------------- care console

export interface ConsoleResident {
  id: string
  first_name: string
  last_name: string
  room_number: string
  unit_name: string
  care_level: Resident['care_level']
  assignee: string | null
  sessions: number
  /** Up to 8 sessions, oldest first. Call length in seconds. */
  call_length: (number | null)[]
  /** positive_word_share 0..1; null = spoke too little to measure. Up to 8, oldest first. */
  warmth: (number | null)[]
  /** Baseline (median of the first four sessions) for each measure. */
  anchors: { call_length: number | null; warmth: number | null }
  threads_open: number
  threads_acknowledged: number
  yearnings_open: number
}
