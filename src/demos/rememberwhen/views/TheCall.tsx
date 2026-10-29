import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useRW } from '../store'
import { RESIDENT } from '../data/resident'
import { CALLS, SESSIONS } from '../data/sessions'
import type { ExtractionEvent, Session } from '../data/types'
import { NODES } from '../data/graph'
import { canHearAndRead, notSharedReason, isOrgRole } from '../lib/access'
import { fmtDate, mmss } from '../lib/growth'
import { cx } from '../../shared/ui'
import { Badge, Empty, PanelTitle, RWButton, RWCard } from './ui'

const STATUS_TONE: Record<Session['status'], 'recalled' | 'neutral' | 'signal' | 'captured'> = {
  completed: 'recalled',
  ended: 'neutral',
  failed: 'signal',
  initiated: 'captured',
}

function SessionsList() {
  const { openCall, viewer } = useRW()
  const [open, setOpen] = useState<number | null>(null)
  const rows = [...SESSIONS].reverse()
  return (
    <div>
      <div className="text-xs text-rw-faint">{isOrgRole(viewer) ? 'Residents' : viewer === 'family' ? 'Family' : 'My conversations'} · Sessions</div>
      <h1 className="mt-1 text-[26px] font-semibold">{RESIDENT.display_name}</h1>
      <p className="text-sm text-rw-muted">{SESSIONS.length} sessions · open one to hear it, read it, and see what was captured</p>
      <RWCard className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-rw-line text-left text-xs text-rw-muted">
            <tr>
              {['Date', 'Status', 'Length', 'Summary', 'Knowledge Graph', 'Replay'].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.call_id} className="border-b border-rw-line/70 align-top last:border-0">
                <td className="px-4 py-3 whitespace-nowrap">{fmtDate(s.date)}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[s.status]}>{s.status[0].toUpperCase() + s.status.slice(1)}</Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-rw-muted">{s.duration_seconds ? mmss(s.duration_seconds) : '—'}</td>
                <td className="max-w-[380px] px-4 py-3">
                  <button onClick={() => setOpen(open === s.number ? null : s.number)} className="text-left hover:text-rw-captured">
                    <span className="font-medium">{s.title}</span>
                  </button>
                  {open === s.number && (
                    <div className="mt-2 rounded-lg border border-rw-line bg-rw-soft p-3 text-[13px] text-rw-muted">
                      <div className="mb-1 flex justify-between text-xs font-semibold text-rw-ink">
                        Summary · {fmtDate(s.date)}
                        <button onClick={() => setOpen(null)} className="font-medium text-rw-captured">
                          Close
                        </button>
                      </div>
                      {s.summary}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-rw-muted">{s.memories_added ? `+${s.memories_added} memories` : '—'}</td>
                <td className="px-4 py-3">
                  {s.replayable ? (
                    <RWButton variant="link" onClick={() => openCall(s.call_id)}>
                      Replay
                    </RWButton>
                  ) : (
                    <span className="text-xs text-rw-faint">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </RWCard>
      <p className="mt-2 text-xs text-rw-faint">Three sessions in this demo have a full transcript and extraction record.</p>
    </div>
  )
}

const GROUPS: { kind: ExtractionEvent['kind']; title: string; desc: string; color: string }[] = [
  { kind: 'captured', title: 'Captured', desc: 'New to the memory graph, from this conversation.', color: '#1e63b4' },
  { kind: 'recalled', title: 'Recalled', desc: 'Memories Andrew brought into the conversation.', color: '#137a4b' },
  { kind: 'signal', title: 'Signals', desc: 'Things the resident asked for.', color: '#b3261e' },
]

function Feed({ events, quotesVisible, activeSeq, onHear }: { events: ExtractionEvent[]; quotesVisible: boolean; activeSeq: number | null; onHear: ((seq: number) => void) | null }) {
  const counts = { captured: 0, recalled: 0, signal: 0 }
  events.forEach((e) => counts[e.kind]++)
  const created = events.filter((e) => e.created_entity).length
  return (
    <RWCard className="flex h-full flex-col p-5">
      <PanelTitle sub={created ? `${created} new to the memory graph` : 'What the system took from the call, and what it gave back.'}>From this conversation</PanelTitle>
      <div className="mb-4 grid grid-cols-3 gap-2 border-b border-rw-line pb-4">
        {GROUPS.map((g) => (
          <div key={g.kind}>
            <div className={cx('text-[28px] leading-none font-bold', !counts[g.kind] && 'text-rw-faint')} style={counts[g.kind] ? { color: g.color } : undefined}>
              {counts[g.kind]}
            </div>
            <div className="mt-1 text-xs text-rw-muted">{g.kind === 'signal' ? 'signals' : g.kind}</div>
          </div>
        ))}
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
        {GROUPS.filter((g) => counts[g.kind]).map((g) => (
          <div key={g.kind}>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.color }} />
              <h4 className="text-xs font-bold tracking-wider text-rw-ink uppercase">{g.title}</h4>
            </div>
            <p className="-mt-1 mb-2 text-xs text-rw-faint">{g.desc}</p>
            <div className="space-y-2">
              {events
                .filter((e) => e.kind === g.kind)
                .map((e, i) => {
                  const active = activeSeq !== null && e.message_seq === activeSeq
                  const note = e.kind === 'signal' && !quotesVisible ? undefined : e.note
                  return (
                    <div key={i} className={cx('rounded-lg border p-3 transition', active ? 'border-rw-captured bg-rw-captured/5' : 'border-rw-line')}>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-rw-faint">
                        {e.created_entity && <span className="rounded px-1.5 py-px text-[10px] font-bold text-white" style={{ background: '#1e63b4' }}>new</span>}
                        {e.predicate && <span>{String(e.predicate).replace(/_/g, ' ')}</span>}
                      </div>
                      <div className="mt-0.5 text-[15px] font-medium">{e.label}</div>
                      {note &&
                        (e.kind === 'recalled' ? (
                          <div className="mt-1.5 border-l-2 pl-2 text-[13px] text-rw-muted" style={{ borderColor: g.color }}>
                            {note}
                          </div>
                        ) : (
                          <div className="mt-1 text-[11px] text-rw-muted italic">{note}</div>
                        ))}
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        {e.entities.map((en) => (
                          <span
                            key={en.name}
                            title={e.kind === 'recalled' ? 'Recalled from an earlier conversation' : en.novelty === 'new' ? 'New to the graph' : 'Matched an existing entity'}
                            className={cx('rounded-full px-2 py-0.5 text-[11px]', en.novelty === 'new' && e.kind !== 'recalled' ? 'bg-rw-captured/12 text-rw-captured' : 'bg-rw-soft text-rw-muted')}
                          >
                            {NODES.find((n) => n.name === en.name)?.display_name ?? en.name}
                          </span>
                        ))}
                        {onHear && (
                          <button onClick={() => onHear(e.message_seq)} className="ml-auto text-xs font-medium text-rw-captured hover:underline">
                            Hear this
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
        {!events.length && <Empty>Nothing was extracted from this conversation.</Empty>}
      </div>
      <div className="mt-3 space-y-1 border-t border-rw-line pt-3 text-xs text-rw-muted">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm bg-rw-captured" /> Captured — new to the graph
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm bg-rw-recalled" /> Recalled — Andrew returning something held
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-sm bg-rw-signal" /> Signal — routed to the care team
        </div>
      </div>
    </RWCard>
  )
}

function CallReview({ callId }: { callId: string }) {
  const { viewer, consent, openCall, startAtMs } = useRW()
  const session = SESSIONS.find((s) => s.call_id === callId)!
  const call = CALLS[callId]
  const shared = canHearAndRead(viewer, consent)
  const turns = call.turns
  const lastMs = turns[turns.length - 1].offset_ms + 6000
  const [ms, setMs] = useState(startAtMs)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const scroller = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    setMs(startAtMs)
    setPlaying(false)
  }, [callId, startAtMs])

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const dt = (now - last) * speed
      last = now
      setMs((m) => {
        const n = m + dt
        if (n >= lastMs) {
          setPlaying(false)
          return lastMs
        }
        return n
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, lastMs])

  const liveIdx = useMemo(() => {
    let idx = -1
    turns.forEach((t, i) => t.offset_ms <= ms && (idx = i))
    return idx
  }, [ms, turns])
  const live = liveIdx >= 0 ? turns[liveIdx] : null

  useEffect(() => {
    if (!playing || !live) return
    const el = rowRefs.current[live.seq]
    const box = scroller.current
    if (!el || !box) return
    const top = el.offsetTop - box.offsetTop
    if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTo({ top: top - box.clientHeight / 3, behavior: 'smooth' })
  }, [live, playing])

  const seekToSeq = (seq: number) => {
    const t = turns.find((x) => x.seq === seq)
    if (t) {
      setMs(t.offset_ms)
      setPlaying(true)
    }
  }
  const replayable = SESSIONS.filter((s) => s.replayable)
  const stateLabel = !shared ? 'not shared' : playing ? 'playing' : ms > 0 && ms < lastMs ? 'paused' : 'ready to play'

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <button onClick={() => openCall(null)} className="font-medium text-rw-captured hover:underline">
          ← All sessions
        </button>
        <span className="text-rw-faint">·</span>
        {replayable.map((s) => (
          <button
            key={s.call_id}
            onClick={() => openCall(s.call_id)}
            className={cx('rounded-full border px-3 py-1 text-xs', s.call_id === callId ? 'border-rw-captured bg-rw-captured/8 font-semibold text-rw-captured' : 'border-rw-line bg-white text-rw-muted hover:text-rw-ink')}
          >
            {s.number} · {s.title}
          </button>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)_400px] [&>*]:min-w-0">
        {/* ------------------------------------------------ player */}
        <RWCard className="self-start p-5">
          <div className="rounded-xl bg-rw-nav px-5 py-6 text-center text-white">
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border-2 border-rw-nav-line bg-[#1d3150] text-4xl font-bold text-rw-nav-text">{RESIDENT.first_name[0]}</div>
            <div className="mt-4 text-2xl font-bold">{RESIDENT.display_name}</div>
            <div className="mt-1 text-sm text-rw-nav-text">
              Room {RESIDENT.room_number} · {RESIDENT.unit_name}
            </div>
            <div className="text-sm text-rw-nav-text">{RESIDENT.organization_name}</div>
            <div className="mt-4 text-sm text-rw-nav-active">{stateLabel}</div>
            <div className="mt-1 font-mono text-4xl font-bold">{mmss(ms / 1000)}</div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => (ms >= lastMs ? (setMs(0), setPlaying(true)) : setPlaying((p) => !p))}
              disabled={!shared}
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-rw-captured text-white disabled:bg-rw-faint"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
            </button>
            <input type="range" min={0} max={lastMs} value={ms} disabled={!shared} onChange={(e) => setMs(Number(e.target.value))} className="flex-1 accent-[#1e63b4]" aria-label="Seek" />
          </div>
          <div className="mt-1 flex justify-between font-mono text-xs text-rw-muted">
            <span>{mmss(ms / 1000)}</span>
            <span>{mmss(lastMs / 1000)}</span>
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-rw-line pt-4 text-sm">
            Speed
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="rounded-md border border-rw-line px-2 py-1">
              {[1, 1.25, 1.5, 2].map((s) => (
                <option key={s} value={s}>
                  {s}×
                </option>
              ))}
            </select>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-rw-muted">
            {shared
              ? `About ${mmss(session.duration_seconds)} in total — includes ringing. This demo has no audio: playback follows the transcript on the call's own timing.`
              : isOrgRole(viewer)
                ? 'Recordings are not shared with staff.'
                : 'Recordings are not shared with family.'}
          </p>
        </RWCard>

        {/* ------------------------------------------------ transcript */}
        <RWCard className="flex flex-col p-5 xl:h-[calc(100vh-260px)] xl:min-h-[560px]">
          <PanelTitle sub={`Session ${session.number} · week ${session.week} · ${fmtDate(session.date)} · about ${mmss(session.duration_seconds)}`}>{session.title}</PanelTitle>
          {shared ? (
            <div ref={scroller} className="relative max-h-[60vh] min-h-0 flex-1 overflow-y-auto pr-2 xl:max-h-none">
              {turns.map((t, i) => {
                const state = i === liveIdx && (playing || ms > 0) ? 'live' : t.offset_ms < ms ? 'past' : 'future'
                return (
                  <div
                    key={t.seq}
                    ref={(el) => {
                      rowRefs.current[t.seq] = el
                    }}
                    onClick={() => {
                      setMs(t.offset_ms)
                    }}
                    className={cx('grid cursor-pointer grid-cols-[96px_1fr] gap-3 rounded-lg px-2 py-2.5 transition hover:bg-rw-soft', state === 'live' && 'bg-rw-captured/6')}
                  >
                    <span className={cx('pt-0.5 text-sm', state === 'live' ? 'font-semibold text-rw-ink' : 'text-rw-muted')}>{t.role === 'assistant' ? 'Andrew' : 'Resident'}</span>
                    <span className={cx('text-[17px] leading-relaxed', state === 'live' ? 'font-semibold text-rw-ink' : state === 'past' ? 'text-rw-faint' : 'text-rw-ink')}>{t.text || <i>(no words)</i>}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <Empty>{notSharedReason(viewer)}</Empty>
          )}
        </RWCard>

        {/* ------------------------------------------------ extraction */}
        <div className="xl:h-[calc(100vh-260px)] xl:min-h-[560px]">
          <Feed events={call.events} quotesVisible={shared} activeSeq={playing || ms > 0 ? (live?.seq ?? null) : null} onHear={shared ? seekToSeq : null} />
        </div>
      </div>
    </div>
  )
}

export default function TheCall() {
  const { callId } = useRW()
  return callId ? <CallReview key={callId} callId={callId} /> : <SessionsList />
}
