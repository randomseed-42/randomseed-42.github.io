// Biosketch content for Nell: what her caregivers and family see. Invented; non-clinical.

import { isoWeekLabel } from './resident'
import { SESSIONS } from './sessions'
import type { BiosketchContent } from './types'

const last = SESSIONS.filter((s) => s.status !== 'failed').at(-1)!
const prev = SESSIONS.filter((s) => s.status === 'completed' && s.week < last.week).at(-1)!

/** Conversations, minutes and memories added for the last eight demo weeks (23–30). */
const trend = Array.from({ length: 8 }, (_, i) => {
  const week = 23 + i
  const s = SESSIONS.filter((x) => x.week === week && x.status !== 'failed')
  return {
    week_label: isoWeekLabel(week),
    sessions: s.length,
    seconds: s.reduce((a, x) => a + x.duration_seconds, 0),
    memories_added: s.reduce((a, x) => a + x.memories_added, 0),
  }
})

export const BIOSKETCH: BiosketchContent = {
  start_with: [
    { facet: 'nostalgia', label: 'The bookmobile route', detail: 'Twenty-one years driving the county bookmobile to farm lanes and one-room schools. Ask about a favorite stop.', quote: "You'd come over the hill and there'd be three kids sitting on the mailbox, waiting.", mentions: 5 },
    { facet: 'want', label: 'Loon calls in the evening', detail: 'She misses hearing loons from the cabin dock and would like to hear them again.', quote: "If somebody could find me the loons, I'd sleep like a baby.", mentions: 3 },
    { facet: 'hope', label: "Be there for Elsa's first day of school", detail: 'Her great-granddaughter Elsa starts kindergarten next fall. She wants to give her a book that morning.', quote: "I'd like to be there with a new book for her first day.", mentions: 2 },
    { facet: 'nostalgia', label: 'Saturday lefse with Grandma Berit', detail: 'She was the one who rolled the lefse thin enough to read the newspaper through.', quote: 'You have to roll it so thin you can read the newspaper through it. That was her test.', mentions: 2 },
  ],
  since_last_week: {
    this: { date: last.date, seconds: last.duration_seconds, memories: last.memories_added },
    previous: { date: prev.date, seconds: prev.duration_seconds, memories: prev.memories_added },
    headline: 'Remembered the January the bookmobile slid into a ditch on County Road 9, and the farmer who pulled it out.',
    quote: "He hooked a chain on and pulled us out like we were nothing. And he wouldn't take a dime.",
  },
  talking_about: [
    { label: 'The bookmobile stuck on County Road 9, January 1971', date: last.date, type: 'headline' },
    { label: 'Danny Prescott, the boy who read every dinosaur book', date: last.date, type: 'fact' },
    { label: 'Singing alto at the Cedar Hollow fall concert', date: SESSIONS.find((s) => s.week === 29)!.date, type: 'headline' },
    { label: 'In charge of the garden club’s rhubarb patch', date: SESSIONS.find((s) => s.week === 28)!.date, type: 'headline' },
    { label: 'Phoning her father when the Edmund Fitzgerald went down', date: SESSIONS.find((s) => s.week === 27)!.date, type: 'fact' },
    { label: 'Evening paddles in the Gray Lady and Leif’s first walleye', date: SESSIONS.find((s) => s.week === 26)!.date, type: 'headline' },
  ],
  community_approach:
    'At Cedar Hollow we begin with what each person enjoys and can still do. Staff learn residents’ stories so that ordinary moments, like meals, mornings and activities, can start from something familiar.',
  guidance: [
    { kind: 'preference', text: 'Call her Nell. Only her mother called her Eleanor.', status: 'active', by_resident: true },
    { kind: 'communication', text: 'Sit on her left side when you talk with her; she hears best on that side.', status: 'active', by_resident: true },
    { kind: 'tone', text: 'She enjoys gentle teasing about the pie-contest judge. Let her tell it.', status: 'active', by_resident: false },
    { kind: 'emotional_state', text: 'Evenings can feel long since Gus died. Company after supper helps.', status: 'active', by_resident: false },
    { kind: 'steer_around', text: 'Don’t bring up the sale of the lake cabin. She finds it upsetting.', status: 'active', by_resident: true },
    { kind: 'steer_around', text: 'Around the November anniversary, avoid dwelling on the Edmund Fitzgerald; it brings back worry for her father.', status: 'active', by_resident: false },
    { kind: 'preference', text: 'Likes her window open a crack at night, like at the lake.', status: 'proposed', by_resident: false },
    { kind: 'communication', text: 'Give her time to finish a story; the best part usually comes last.', status: 'proposed', by_resident: false },
  ],
  threads: [
    { id: 'th-window', signal_type: 'request', category: 'fresh_air', state: 'open', raised_at: last.date, state_changed_at: last.date, acknowledged: false, label: 'Window open a crack at night', quote: 'I sleep better with a little cold air, like at the lake. Could somebody open my window a crack?', try: { text: 'Ask whether she would like the window opened an inch at bedtime, and close it again at the morning check.', domain: 'environment' } },
    { id: 'th-alto', signal_type: 'request', category: 'music', state: 'raised_again', raised_at: '2026-09-02', state_changed_at: '2026-10-07', acknowledged: true, label: 'Wants to sing with the altos at the hymn sing', quote: "They always put me with the sopranos, and I'm an alto. Always was.", try: { text: 'Seat her with the lower voices at Thursday’s hymn sing and invite her to start a favorite hymn.', domain: 'company' } },
    { id: 'th-tess', signal_type: 'concern', category: 'family_visits', state: 'resident_reports_resolved', raised_at: '2026-08-12', state_changed_at: '2026-09-16', acknowledged: true, label: 'Worried Tess had not visited', quote: "Tess usually comes the second Sunday. I didn't see her this month.", try: { text: 'Offer to set up a video call with Tess on a Sunday afternoon.', domain: 'company' } },
    { id: 'th-evenings', signal_type: 'concern', category: 'evenings', state: 'quiet', raised_at: '2026-07-08', state_changed_at: '2026-08-19', acknowledged: false, label: 'Evenings feel long', quote: 'After supper it gets awfully quiet in here.', try: { text: 'Invite her to the after-supper card game; Dorothea Pruitt plays most evenings.', domain: 'routine' } },
  ],
  moments: [
    { id: 'mo-loons', facet: 'want', label: 'Hear loon calls in the evening', quote: "If somebody could find me the loons, I'd sleep like a baby.", status: 'open', created_at: '2026-09-23' },
    { id: 'mo-elsa', facet: 'hope', label: "Be at Elsa's first day of school", quote: "I'd like to be there with a new book for her first day.", status: 'open', created_at: '2026-08-26' },
    { id: 'mo-route', facet: 'nostalgia', label: 'Misses the bookmobile route', quote: "You'd come over the hill and there'd be three kids sitting on the mailbox.", status: 'acknowledged', created_at: '2026-04-08' },
    { id: 'mo-lefse', facet: 'nostalgia', label: 'Misses Saturday lefse with Grandma Berit', quote: 'You have to roll it so thin you can read the newspaper through it.', status: 'open', created_at: '2026-08-26' },
    { id: 'mo-rhubarb', facet: 'want', label: 'Wanted rhubarb pie in the spring', quote: 'Rhubarb in May, or what is the point of May?', status: 'done', created_at: '2026-05-13' },
  ],
  trend,
  baseline: [
    { label: 'Preferred name', detail: 'Nell' },
    { label: 'Hearing', detail: 'Hears best on her left side; prefers people sit there.' },
    { label: 'Glasses', detail: 'Reading glasses on a beaded chain, usually on the nightstand.' },
    { label: 'Routine', detail: 'Up at six. Black coffee and the crossword before breakfast.' },
    { label: 'Faith', detail: 'Lifelong Lutheran. The Thursday hymn sing matters to her.' },
    { label: 'Room', detail: 'Room 118, The Birches. Window seat facing the bird feeders.' },
  ],
  briefing: [
    { text: 'This is your briefing for Nell Lindqvist in Room 118, The Birches.', source: 'header' },
    { text: 'Please don’t bring up the sale of the lake cabin. That request is her own.', source: 'do_not_raise' },
    { text: 'A good place to start is the bookmobile. She drove it for twenty-one years and loves to talk about her route.', source: 'start_with' },
    { text: 'She would also love to hear loon calls in the evening, if anyone can find a recording.', source: 'start_with' },
    { text: 'In her last conversation she remembered the bookmobile sliding into a ditch in 1971, and a farmer who pulled it out with his tractor.', source: 'since_last_week' },
    { text: 'Her husband Gus died in 2011. Her daughters Annika and Tess visit often, and her sister Solveig calls every Sunday at four.', source: 'who_she_is' },
    { text: 'Her friend Dorothea across the hall plays gin rummy with her after lunch.', source: 'who_she_is' },
    { text: 'That’s the briefing. Thank you for taking care of Nell.', source: 'footer' },
  ],
}
