import { useEffect, useState, type ReactNode } from 'react'
import { Pause, Play } from 'lucide-react'
import { useRW } from '../store'
import { RESIDENT } from '../data/resident'
import { BIOSKETCH } from '../data/biosketch'
import { NODES, CHAPTERS } from '../data/graph'
import { SESSIONS } from '../data/sessions'
import type { GuidanceItem, Moment, SignalThread } from '../data/types'
import {
  GUIDANCE_KIND_LABEL,
  VIEW_LABEL,
  biosketchViews,
  canHearAndRead,
  isOrgRole,
  mayAcknowledge,
  mayEditCommunityApproach,
  seesAssignee,
  seesBriefing,
  seesTry,
  writableGuidanceKinds,
  type BiosketchView,
} from '../lib/access'
import { fmtDate, mmss } from '../lib/growth'
import { cx } from '../../shared/ui'
import { Badge, CardTitle, Empty, Foot, Quote, RWButton, RWCard } from './ui'
import { chapterColor } from './MemoryGraph'

const CARE_LEVEL = { independent: 'Independent living', assisted: 'Assisted living', memory_care: 'Memory care' }
const MEDICAL = /\b(medic|mg\b|dose|dosage|diagnos|dementia|alzheimer|parkinson|prescri|score|moca|mmse|pill|tablet|blood pressure)/i

function Card({ title, aside, children, foot, caution, empty }: { title: string; aside?: ReactNode; children?: ReactNode; foot?: ReactNode; caution?: boolean; empty?: string }) {
  return (
    <RWCard dashed={!!empty} className={cx('p-5', caution && 'border-rw-ochre/40 bg-rw-caution')}>
      <CardTitle aside={aside}>{title}</CardTitle>
      {empty ? <Empty>{empty}</Empty> : children}
      {foot && !empty && <Foot>{foot}</Foot>}
    </RWCard>
  )
}

// ------------------------------------------------------------------ shared cards

function WhoSheIs({ portrait }: { portrait?: boolean }) {
  const people = NODES.filter((n) => n.relation_to_holder.length && n.kind === 'person').sort((a, b) => b.discussed_count - a.discussed_count).slice(0, 5)
  const places = NODES.filter((n) => n.relation_to_holder.length && n.kind !== 'person').sort((a, b) => b.discussed_count - a.discussed_count).slice(0, 4)
  const rel = (r: string) => r.replace(/^has_/, '').replace(/_/g, ' ')
  return (
    <Card title="Who she is" foot={`From her memory graph, ${fmtDate(SESSIONS[SESSIONS.length - 1].date)}`}>
      {portrait && (
        <p className="mb-3 text-sm text-rw-faint italic">
          The longer written portrait that sits here in the product is left out of this public demo.
        </p>
      )}
      <ul className="space-y-2.5">
        {[...people, ...places].map((n) => {
          const ch = CHAPTERS.find((c) => c.id === n.chapter)
          return (
            <li key={n.name} className="text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{n.display_name}</span>
                <span className="text-rw-muted">{n.relation_to_holder.map(rel).join(', ')}</span>
                {ch && (
                  <span className="flex items-center gap-1 text-[11px] text-rw-faint">
                    <span className="h-2 w-2 rounded-full" style={{ background: chapterColor(ch.id) }} />
                    {ch.name}
                  </span>
                )}
              </div>
              <div className="text-[13px] text-rw-muted">{n.fact}</div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function SinceLastWeek({ quotes, clinical }: { quotes: boolean; clinical?: boolean }) {
  const s = BIOSKETCH.since_last_week
  const memDelta = s.this.memories === s.previous.memories ? 'no change' : `${s.this.memories}, ${s.this.memories > s.previous.memories ? 'up' : 'down'} from ${s.previous.memories}`
  return (
    <Card title={clinical ? 'Change since last session' : 'Since last week'} foot={`Conversation on ${fmtDate(s.this.date)}, against ${fmtDate(s.previous.date)}`}>
      <div className="text-[15px] font-medium">{s.headline}</div>
      <Quote hidden={!quotes}>{s.quote}</Quote>
      <dl className="mt-2 grid grid-cols-[130px_1fr] gap-y-1 text-sm">
        <dt className="text-rw-muted">Length</dt>
        <dd>
          {mmss(s.this.seconds)} <span className="text-rw-faint">(last time about {mmss(s.previous.seconds)})</span>
        </dd>
        <dt className="text-rw-muted">Memories added</dt>
        <dd>{memDelta}</dd>
      </dl>
    </Card>
  )
}

function StartWith({ quotes }: { quotes: boolean }) {
  const groups: [string, 'want' | 'hope' | 'nostalgia'][] = [
    ['Wants', 'want'],
    ['Hopes for', 'hope'],
    ['Misses', 'nostalgia'],
  ]
  return (
    <Card title="Something to start with" foot="What she has said she wants, hopes for, or misses — from her own conversations." empty={BIOSKETCH.start_with.length ? undefined : 'No open wish, hope or fond memory on record yet.'}>
      <div className="space-y-4">
        {groups.map(([label, facet]) => {
          const items = BIOSKETCH.start_with.filter((x) => x.facet === facet)
          if (!items.length) return null
          return (
            <div key={facet}>
              <h4 className="mb-1.5 text-xs font-bold tracking-wider text-rw-muted uppercase">{label}</h4>
              {items.map((x) => (
                <div key={x.label} className="mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-medium">{x.label}</span>
                    <Badge>Mentioned in {x.mentions} conversation{x.mentions > 1 ? 's' : ''}</Badge>
                  </div>
                  <div className="text-sm text-rw-muted">{x.detail}</div>
                  <Quote hidden={!quotes}>{x.quote}</Quote>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function DoNotRaise({ guidance }: { guidance: GuidanceItem[] }) {
  const items = guidance.filter((g) => g.kind === 'steer_around' && g.status === 'active')
  return (
    <Card title="Do not raise" caution foot="Topics to steer around, from care guidance." empty={items.length ? undefined : 'Nothing to steer around has been noted.'}>
      <ul className="space-y-1.5 text-[15px]">
        {items.map((g) => (
          <li key={g.text}>
            {g.text}
            {g.by_resident && <span className="text-sm text-rw-ochre"> · her own request</span>}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Briefing() {
  const lines = BIOSKETCH.briefing
  const [playing, setPlaying] = useState(false)
  const [line, setLine] = useState(-1)
  const [showScript, setShowScript] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [speed, setSpeed] = useState(1)
  useEffect(() => {
    if (!playing) return
    const words = lines[Math.max(0, line)]?.text.split(/\s+/).length ?? 10
    const t = setTimeout(
      () => {
        if (line >= lines.length - 1) {
          setPlaying(false)
          setLine(-1)
        } else setLine((l) => l + 1)
      },
      (line < 0 ? 300 : words * 330) / speed,
    )
    return () => clearTimeout(t)
  }, [playing, line, lines, speed])
  const SOURCE: Record<string, string> = { header: 'header', do_not_raise: 'Do not raise', start_with: 'Something to start with', since_last_week: 'Since last week', who_she_is: 'Who she is', footer: 'footer' }
  return (
    <RWCard className="p-5">
      <CardTitle>Ninety-second briefing</CardTitle>
      <p className="-mt-2 mb-3 text-sm text-rw-muted">{updating ? 'Being updated…' : `Made ${fmtDate(SESSIONS[SESSIONS.length - 1].date)} · about 1 minute · in Andrew's voice, from the cards below.`}</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (!playing && line < 0) setLine(0)
            setPlaying((p) => !p)
          }}
          className="grid h-14 w-14 place-items-center rounded-full bg-rw-captured text-white"
          aria-label={playing ? 'Pause briefing' : 'Play briefing'}
        >
          {playing ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
        </button>
        <div className="min-w-0 flex-1 text-sm text-rw-muted">{line >= 0 ? <span className="text-rw-ink">“{lines[line].text}”</span> : 'No audio in this demo: playback steps through the script.'}</div>
        <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="rounded-md border border-rw-line px-1.5 py-1 text-xs">
          {[1, 1.25, 1.5].map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </div>
      <button onClick={() => setShowScript((s) => !s)} className="mt-3 text-sm font-medium text-rw-captured hover:underline">
        {showScript ? 'Hide' : 'Show'} the script, and where every line came from
      </button>
      {showScript && (
        <ol className="mt-2 space-y-1.5">
          {lines.map((l, i) => (
            <li key={i} className={cx('rounded-md px-2 py-1 text-sm', i === line && 'bg-rw-captured/8')}>
              {l.text} <span className="text-[11px] text-rw-faint">· from {SOURCE[l.source]}</span>
            </li>
          ))}
        </ol>
      )}
      <Foot>
        <span className="flex flex-wrap items-center justify-between gap-2">
          Labels and summaries only — never her exact words.
          <RWButton
            variant="ghost"
            className="!py-1 !text-xs"
            disabled={updating}
            onClick={() => {
              setUpdating(true)
              setTimeout(() => setUpdating(false), 1600)
            }}
          >
            {updating ? 'Updating…' : 'Make a fresh one'}
          </RWButton>
        </span>
      </Foot>
    </RWCard>
  )
}

// ------------------------------------------------------------------ moments panel

const STATE_LABEL: Record<SignalThread['state'], string> = {
  open: 'Raised',
  raised_again: 'Raised again',
  resident_reports_resolved: 'She says it is sorted',
  quiet: 'Not mentioned lately',
}

function TryBlock({ text }: { text: string }) {
  return (
    <div className="mt-2 rounded-lg border border-dashed border-rw-ochre/50 bg-rw-caution/60 p-3 text-sm">
      <div className="text-xs font-bold text-rw-ochre">Under test: do not act on this suggestion.</div>
      <div className="mt-1">{text}</div>
      <div className="mt-1 text-[11px] text-rw-muted">Drafted by the system from what she said about this, and shown only so we can judge whether such suggestions are any good. Nobody has reviewed it.</div>
    </div>
  )
}

export function MomentsPanel({ quotes }: { quotes: boolean }) {
  const { viewer } = useRW()
  const [ack, setAck] = useState<Record<string, boolean>>({})
  const [status, setStatus] = useState<Record<string, Moment['status']>>({})
  const thread = (t: SignalThread) => {
    const seen = ack[t.id] ?? t.acknowledged
    return (
      <div key={t.id} className="border-b border-rw-line py-3 last:border-0">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{t.label}</span>
          <span className="text-xs text-rw-faint">
            {STATE_LABEL[t.state]} · {fmtDate(t.state_changed_at, { day: 'numeric', month: 'short' })}
          </span>
          {seen && <Badge tone="recalled">Seen by staff</Badge>}
          {mayAcknowledge(viewer) && (
            <button onClick={() => setAck((a) => ({ ...a, [t.id]: !seen }))} className="ml-auto text-xs font-medium text-rw-captured hover:underline">
              {seen ? 'Unmark' : 'Mark as seen'}
            </button>
          )}
        </div>
        <Quote hidden={!quotes}>{t.quote}</Quote>
        {seesTry(viewer) && <TryBlock text={t.try.text} />}
      </div>
    )
  }
  const moment = (m: Moment) => (
    <div key={m.id} className="border-b border-rw-line py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{m.label}</span>
        <span className="text-xs text-rw-faint">since {fmtDate(m.created_at, { day: 'numeric', month: 'short' })}</span>
        {isOrgRole(viewer) && (
          <select value={status[m.id] ?? m.status} onChange={(e) => setStatus((s) => ({ ...s, [m.id]: e.target.value as Moment['status'] }))} className="ml-auto rounded-md border border-rw-line px-1.5 py-0.5 text-xs">
            <option value="open">Open</option>
            <option value="acknowledged">Seen</option>
            <option value="done">Done</option>
          </select>
        )}
      </div>
      <Quote hidden={!quotes}>{m.quote}</Quote>
    </div>
  )
  const groups: [string, ReactNode[]][] = [
    ['Requests', BIOSKETCH.threads.filter((t) => t.signal_type === 'request').map(thread)],
    ['Concerns', BIOSKETCH.threads.filter((t) => t.signal_type === 'concern').map(thread)],
    ['Wants', BIOSKETCH.moments.filter((m) => m.facet === 'want').map(moment)],
    ['Hopes for', BIOSKETCH.moments.filter((m) => m.facet === 'hope').map(moment)],
    ['Misses', BIOSKETCH.moments.filter((m) => m.facet === 'nostalgia').map(moment)],
  ]
  return (
    <RWCard className="p-5">
      <CardTitle>Requests, concerns and yearnings</CardTitle>
      <p className="-mt-2 mb-3 text-sm text-rw-muted">What she has asked for, worried about, and longed for — in her conversations, for the community to act on.</p>
      <div className="space-y-4">
        {groups
          .filter(([, items]) => items.length)
          .map(([label, items]) => (
            <div key={label}>
              <h4 className="text-xs font-bold tracking-wider text-rw-muted uppercase">{label}</h4>
              {items}
            </div>
          ))}
      </div>
    </RWCard>
  )
}

// ------------------------------------------------------------------ care guidance

function CareGuidance() {
  const { viewer } = useRW()
  const [items, setItems] = useState<GuidanceItem[]>(BIOSKETCH.guidance)
  const [approach, setApproach] = useState(BIOSKETCH.community_approach)
  const kinds = writableGuidanceKinds(viewer)
  const [kind, setKind] = useState<string>(kinds[0])
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  useEffect(() => setKind(kinds[0]), [viewer]) // eslint-disable-line react-hooks/exhaustive-deps
  const proposed = items.filter((g) => g.status === 'proposed')
  const active = items.filter((g) => g.status === 'active')
  const add = () => {
    if (!text.trim()) return
    if (MEDICAL.test(text)) return setError('Not saved: care guidance is not medical information. Conditions, medications, doses and scores belong in the care record.')
    setItems((xs) => [...xs, { kind: kind as GuidanceItem['kind'], text: text.trim(), status: 'active', by_resident: viewer === 'self' }])
    setText('')
    setError(null)
  }
  return (
    <RWCard className="p-5">
      <CardTitle>Care guidance</CardTitle>
      <p className="-mt-2 mb-3 text-sm text-rw-muted">An emotional and personal approach to her — not medical information. Andrew reads these before every call.</p>
      {proposed.length > 0 && viewer !== 'self' && (
        <div className="mb-3 rounded-lg border border-rw-ochre/40 bg-rw-caution p-3">
          <div className="mb-1.5 text-xs font-bold text-rw-ochre">Suggested from her conversations — confirm or let go</div>
          {proposed.map((g) => (
            <div key={g.text} className="mb-2 text-sm">
              <span className="text-rw-faint">{GUIDANCE_KIND_LABEL[g.kind]}: </span>
              {g.text}
              <div className="mt-1 flex gap-3">
                <RWButton variant="link" className="!text-xs" onClick={() => setItems((xs) => xs.map((x) => (x === g ? { ...x, status: 'active' } : x)))}>
                  Confirm
                </RWButton>
                <RWButton variant="link" className="!text-xs !text-rw-muted" onClick={() => setItems((xs) => xs.filter((x) => x !== g))}>
                  Let go
                </RWButton>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Object.keys(GUIDANCE_KIND_LABEL).map((k) => {
          const list = active.filter((g) => g.kind === k)
          if (!list.length) return null
          return (
            <div key={k}>
              <h4 className="text-xs font-bold tracking-wider text-rw-muted uppercase">{GUIDANCE_KIND_LABEL[k]}</h4>
              <ul className="mt-1 space-y-1 text-sm">
                {list.map((g) => (
                  <li key={g.text} className="flex gap-2">
                    <span className="flex-1">
                      {g.text}
                      {g.by_resident && <span className="text-rw-faint"> · her own</span>}
                    </span>
                    {viewer !== 'self' && (
                      <button onClick={() => setItems((xs) => xs.filter((x) => x !== g))} className="shrink-0 text-xs text-rw-faint hover:text-rw-ink">
                        Retire
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
      <div className="mt-4 border-t border-rw-line pt-3">
        <div className="flex gap-2">
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-md border border-rw-line px-1.5 py-1 text-xs">
            {kinds.map((k) => (
              <option key={k} value={k}>
                {GUIDANCE_KIND_LABEL[k]}
              </option>
            ))}
          </select>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={viewer === 'self' ? 'Something you would rather not talk about' : 'A note on how to be with her'} className="min-w-0 flex-1 rounded-md border border-rw-line px-2 py-1 text-sm" />
          <RWButton variant="ghost" className="!py-1 !text-xs" onClick={add}>
            Add
          </RWButton>
        </div>
        {error && <p className="mt-2 text-xs text-rw-signal">{error}</p>}
      </div>
      {mayEditCommunityApproach(viewer) && (
        <div className="mt-4 border-t border-rw-line pt-3">
          <h4 className="text-xs font-bold tracking-wider text-rw-muted uppercase">How this community works with residents</h4>
          <textarea value={approach} onChange={(e) => setApproach(e.target.value)} rows={4} className="mt-1 w-full rounded-md border border-rw-line p-2 text-sm" />
          <RWButton variant="ghost" className="!py-1 !text-xs">
            Save approach
          </RWButton>
        </div>
      )}
    </RWCard>
  )
}

// ------------------------------------------------------------------ page

export default function Biosketch() {
  const { viewer, consent } = useRW()
  const { views, opensOn } = biosketchViews(viewer)
  const [view, setView] = useState<BiosketchView>(opensOn)
  const [noticeOpen, setNoticeOpen] = useState(false)
  useEffect(() => setView(opensOn), [viewer, opensOn])
  const quotes = canHearAndRead(viewer, consent)
  const latest = SESSIONS.filter((s) => s.status === 'completed').length
  const guidance = BIOSKETCH.guidance

  let cards: ReactNode
  if (view === 'caregiver')
    cards = (
      <>
        {seesBriefing(viewer) && <Briefing />}
        <StartWith quotes={quotes} />
        <DoNotRaise guidance={guidance} />
        <SinceLastWeek quotes={quotes} />
        <WhoSheIs />
        <Card title="Where the record started" empty="Coming later: what her family and the admissions team told us before her first call." />
      </>
    )
  else if (view === 'family')
    cards = (
      <>
        <WhoSheIs />
        <Card title="What she has been talking about" foot="Headlines from her recent conversations.">
          <ul className="space-y-1.5 text-sm">
            {BIOSKETCH.talking_about
              .filter((t) => t.type === 'headline')
              .map((t) => (
                <li key={t.label} className="flex justify-between gap-3">
                  <span>{t.label}</span>
                  <span className="shrink-0 text-xs text-rw-faint">{fmtDate(t.date, { day: 'numeric', month: 'short' })}</span>
                </li>
              ))}
          </ul>
          <p className="mt-3 text-sm text-rw-muted">
            Recently captured:{' '}
            {BIOSKETCH.talking_about
              .filter((t) => t.type === 'fact')
              .map((t) => t.label)
              .join(' · ')}
          </p>
        </Card>
        <Card title="How this community works with her">
          <p className="text-sm text-rw-muted">{BIOSKETCH.community_approach}</p>
          <ul className="mt-3 space-y-1 text-sm">
            {guidance
              .filter((g) => g.status === 'active' && g.kind !== 'steer_around')
              .map((g) => (
                <li key={g.text}>
                  <span className="text-rw-faint">{GUIDANCE_KIND_LABEL[g.kind]}: </span>
                  {g.text}
                </li>
              ))}
          </ul>
        </Card>
      </>
    )
  else
    cards = (
      <>
        <SinceLastWeek quotes={quotes} clinical />
        <Card title="Standing restrictions" caution empty={guidance.some((g) => g.kind === 'steer_around') || BIOSKETCH.threads.some((t) => t.signal_type === 'concern') ? undefined : 'No standing restriction or open concern.'}>
          <h4 className="text-xs font-bold tracking-wider text-rw-ochre uppercase">Do not raise</h4>
          <ul className="mt-1 mb-3 space-y-1 text-sm">
            {guidance
              .filter((g) => g.kind === 'steer_around' && g.status === 'active')
              .map((g) => (
                <li key={g.text}>{g.text}</li>
              ))}
          </ul>
          <h4 className="text-xs font-bold tracking-wider text-rw-ochre uppercase">Open concerns</h4>
          <ul className="mt-1 space-y-1 text-sm">
            {BIOSKETCH.threads
              .filter((t) => t.signal_type === 'concern')
              .map((t) => (
                <li key={t.id}>
                  {t.label} <span className="text-xs text-rw-faint">· {STATE_LABEL[t.state].toLowerCase()}{t.acknowledged ? ' · seen by staff' : ''}</span>
                </li>
              ))}
          </ul>
        </Card>
        <WhoSheIs portrait />
        <Card title="Trend" aside={`${BIOSKETCH.trend.reduce((a, t) => a + t.sessions, 0)} sessions in the last 8 weeks`} foot="Conversations, minutes and memories added by week. Language measurement stays on the cognitive signals page, which this demo does not include.">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-rw-muted">
              <tr>
                <th className="pb-1 font-semibold">Week</th>
                <th className="pb-1 text-right font-semibold">Sessions</th>
                <th className="pb-1 text-right font-semibold">Minutes</th>
                <th className="pb-1 text-right font-semibold">Memories</th>
              </tr>
            </thead>
            <tbody>
              {BIOSKETCH.trend.map((t) => (
                <tr key={t.week_label} className="border-t border-rw-line">
                  <td className="py-1">{t.week_label}</td>
                  <td className="py-1 text-right">{t.sessions}</td>
                  <td className="py-1 text-right">{Math.round(t.seconds / 60)}</td>
                  <td className="py-1 text-right">{t.memories_added}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="What existed before us" foot="Entered by staff. Never read from handwriting; never shown to the resident.">
          <dl className="grid grid-cols-[150px_1fr] gap-y-1.5 text-sm">
            {BIOSKETCH.baseline.map((b) => (
              <div key={b.label} className="contents">
                <dt className="text-rw-muted">{b.label}</dt>
                <dd>{b.detail}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-rw-faint italic">Diagnosis and admission-assessment fields exist in the product for community staff; they are left out of this public demo.</p>
        </Card>
      </>
    )

  return (
    <div>
      {viewer === 'self' && (
        <RWCard className="mb-4 p-4">
          <button onClick={() => setNoticeOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
            <span className="font-semibold">This page is written for the people who care for you.</span>
            <span className="text-sm text-rw-captured">{noticeOpen ? 'Less' : 'More'}</span>
          </button>
          {noticeOpen && (
            <p className="mt-2 text-sm text-rw-muted">
              This page shows how your family and caregivers receive what Remember When learns from your conversations. It is written for them, which is why it speaks about you rather than to you.
            </p>
          )}
        </RWCard>
      )}

      {views.length > 1 && (
        <div className="mb-4 inline-flex overflow-hidden rounded-lg border border-rw-line bg-white">
          {views.map((v) => (
            <button key={v} onClick={() => setView(v)} className={cx('px-4 py-2 text-sm', view === v ? 'bg-rw-nav font-semibold text-white' : 'text-rw-muted hover:text-rw-ink')}>
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
      )}

      <div className="mb-5">
        <h1 className="text-[26px] font-semibold">{RESIDENT.display_name}</h1>
        <p className="text-sm text-rw-muted">
          Room {RESIDENT.room_number} · {RESIDENT.unit_name} — {RESIDENT.organization_name} · Updated by {latest} conversations
        </p>
        {seesAssignee(viewer) && (
          <p className="mt-0.5 text-sm text-rw-muted">
            {CARE_LEVEL[RESIDENT.care_level]} · Assigned to {RESIDENT.assignee.full_name} · {RESIDENT.assignee.role_label} · {RESIDENT.assignee.job_title}
          </p>
        )}
        {!quotes && <p className="mt-2 rounded-lg bg-rw-soft px-3 py-2 text-sm text-rw-muted">This person hasn't chosen to share their conversations with {isOrgRole(viewer) ? 'the care team' : 'family'}. Her own words are not shown here; the summaries are.</p>}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] [&>*]:min-w-0">
        <div className={cx('space-y-5', view === 'caregiver' && 'max-w-[560px]')}>
          {cards}
          <MomentsPanel quotes={quotes} />
        </div>
        <div className="space-y-5">
          <CareGuidance />
          <RWCard className="p-5">
            <CardTitle>How the record gets seeded</CardTitle>
            <ol className="list-decimal space-y-1.5 pl-4 text-sm text-rw-muted">
              <li>Family and staff add a few names, places and things to steer around before the first call.</li>
              <li>Andrew calls on her schedule. Every conversation adds to her memory graph.</li>
              <li>The cards here rebuild after each call, so the briefing is never older than her last conversation.</li>
            </ol>
          </RWCard>
          <RWCard className="p-5">
            <CardTitle>Why an EHR cannot do this</CardTitle>
            <p className="text-sm text-rw-muted">A health record holds what was done to her. This holds who she is: the people, places and stories she returns to, in her own words, and how she wants to be spoken to.</p>
          </RWCard>
        </div>
      </div>
    </div>
  )
}
