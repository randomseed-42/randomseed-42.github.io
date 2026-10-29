// Care console: the community's worklist. Each resident is compared only with her own
// first weeks: the baseline (anchor) is the median of her first four measured sessions and
// never moves. "Watch" is a display state, not an alert: two sessions in a row where both
// call length and warmth sit below her baseline. Nothing here is red.

import { Fragment, useMemo, useState } from 'react'
import { useRW } from '../store'
import { RESIDENT } from '../data/resident'
import { COMMUNITY_RESIDENTS } from '../data/console'
import type { ConsoleResident } from '../data/types'
import { canHearAndRead } from '../lib/access'
import { fmtDate, mmss, weekDate } from '../lib/growth'
import { CURRENT_WEEK } from '../data/resident'
import { cx } from '../../shared/ui'
import { Badge, CardTitle, RWCard } from './ui'
import { MomentsPanel } from './Biosketch'

const LOW_RATIO = 0.8
const ANCHOR_N = 4
const CARE_LEVEL = { independent: 'Independent living', assisted: 'Assisted living', memory_care: 'Memory care' }

type PointState = 'anchor' | 'low' | 'ok' | 'unknown'

interface Trend {
  anchor: number | null
  points: { value: number | null; state: PointState }[]
  direction: 'low' | 'ok' | null
}

function trend(series: (number | null)[], anchor: number | null, nullIsLow: boolean): Trend {
  let measured = 0
  const points = series.map((value) => {
    if (value !== null && measured < ANCHOR_N) {
      measured++
      return { value, state: 'anchor' as PointState }
    }
    if (anchor === null) return { value, state: 'unknown' as PointState }
    if (value === null) return { value, state: nullIsLow ? ('low' as PointState) : ('unknown' as PointState) }
    return { value, state: value < anchor * LOW_RATIO ? ('low' as PointState) : ('ok' as PointState) }
  })
  const last = [...points].reverse().find((p) => p.state !== 'anchor')
  return { anchor, points, direction: !last || last.state === 'unknown' ? null : last.state === 'low' ? 'low' : 'ok' }
}

function watchState(cl: Trend, wa: Trend) {
  // Pair sessions by index, skip anchor/unknown on either measure, look at the last two.
  const pairs = cl.points.map((p, i) => [p.state, wa.points[i]?.state] as const).filter(([a, b]) => a !== 'anchor' && b !== 'anchor' && a !== 'unknown' && b !== 'unknown')
  const lastTwo = pairs.slice(-2)
  if (lastTwo.length < 2 || !lastTwo.every(([a, b]) => a === 'low' && b === 'low')) return { on: false, since: -1 }
  let start = pairs.length - 2
  while (start > 0 && pairs[start - 1][0] === 'low' && pairs[start - 1][1] === 'low') start--
  return { on: true, since: pairs.length - start }
}

function Sparkline({ t }: { t: Trend }) {
  const W = 120
  const H = 32
  const vals = t.points.map((p) => p.value).filter((v): v is number => v !== null)
  const max = Math.max(...vals, t.anchor ?? 0) * 1.1 || 1
  const x = (i: number) => (t.points.length <= 1 ? W / 2 : 4 + (i / (t.points.length - 1)) * (W - 8))
  const y = (v: number) => H - 3 - (v / max) * (H - 6)
  const path = t.points
    .map((p, i) => (p.value === null ? null : `${x(i)},${y(p.value)}`))
    .filter(Boolean)
    .join(' L')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      {t.anchor !== null && <line x1={0} x2={W} y1={y(t.anchor)} y2={y(t.anchor)} stroke="#98a3ae" strokeDasharray="3 3" strokeWidth={1} />}
      {path && <path d={`M${path}`} fill="none" stroke="#1e63b4" strokeWidth={1.5} />}
      {t.points.map((p, i) =>
        p.value === null ? (
          p.state === 'low' && t.anchor !== null ? <circle key={i} cx={x(i)} cy={y(t.anchor)} r={2.5} fill="#fff" stroke="#a7791b" strokeWidth={1.2} /> : null
        ) : (
          <circle key={i} cx={x(i)} cy={y(p.value)} r={p.state === 'low' ? 2.8 : 1.8} fill={p.state === 'low' ? '#a7791b' : '#1e63b4'} />
        ),
      )}
    </svg>
  )
}

function TrendCell({ t, kind }: { t: Trend; kind: 'call' | 'warmth' }) {
  const last = [...t.points].reverse()[0]
  const words = t.anchor === null ? 'not enough sessions yet' : t.direction === 'low' ? 'below her baseline' : t.direction === 'ok' ? 'within her baseline' : 'not enough sessions yet'
  let figure: string
  if (kind === 'call') figure = last?.value != null ? `${mmss(last.value)}${t.anchor !== null ? ` · her first weeks ${mmss(t.anchor)}` : ''}` : '—'
  else if (last?.value == null) figure = t.points.length ? `Spoke too little to measure${t.anchor !== null ? ` · her first weeks ${Math.round(t.anchor * 100)}%` : ''}` : 'Warmth not measured yet'
  else if (t.anchor === null) figure = 'Measured, but she has no baseline yet'
  else figure = `${Math.round(last.value * 100)}% of her words positive · her first weeks ${Math.round(t.anchor * 100)}%`
  return (
    <div>
      <Sparkline t={t} />
      <div className={cx('mt-0.5 text-xs font-medium', t.direction === 'low' ? 'text-rw-ochre' : 'text-rw-muted')}>{words}</div>
      <div className="text-[11px] text-rw-faint">{figure}</div>
    </div>
  )
}

export default function CareConsole() {
  const { viewer, consent, openCall, setTab } = useRW()
  const [q, setQ] = useState('')
  const [openSignals, setOpenSignals] = useState<string | null>(null)
  // Friday of the current week, after the latest call.
  const asOf = useMemo(() => {
    const d = weekDate(CURRENT_WEEK)
    d.setUTCDate(d.getUTCDate() + 4)
    return d
  }, [])

  const rows = useMemo(
    () =>
      COMMUNITY_RESIDENTS.map((r) => {
        const cl = trend(r.call_length, r.anchors.call_length, false)
        const wa = trend(r.warmth, r.anchors.warmth, true)
        const watch = watchState(cl, wa)
        const sinceDate = new Date(asOf)
        sinceDate.setUTCDate(sinceDate.getUTCDate() - (watch.since - 1) * 7)
        return { r, cl, wa, watch, sinceDate }
      }).sort(
        (a, b) =>
          Number(b.watch.on) - Number(a.watch.on) ||
          Number(b.cl.direction === 'low' || b.wa.direction === 'low') - Number(a.cl.direction === 'low' || a.wa.direction === 'low') ||
          a.r.last_name.localeCompare(b.r.last_name),
      ),
    [asOf],
  )
  const shown = rows.filter(({ r }) => !q || `${r.first_name} ${r.last_name} ${r.room_number} ${r.unit_name}`.toLowerCase().includes(q.toLowerCase()))
  const onWatch = rows.filter((x) => x.watch.on).length
  const active = rows.filter((x) => x.r.call_length[x.r.call_length.length - 1] !== null).length
  const residentMonths = rows.reduce((a, x) => a + x.r.sessions / 4.33, 0)
  const tiles: [string, string | number, string?][] = [
    ['Enrolled', rows.length],
    ['On Watch', onWatch, 'both trends below her baseline, two sessions running'],
    ['Weekly participation', `${Math.round((active / rows.length) * 100)}%`, `${active} of ${rows.length} this week`],
    ['Open requests and concerns', rows.reduce((a, x) => a + x.r.threads_open, 0)],
    ['Open yearnings', rows.reduce((a, x) => a + x.r.yearnings_open, 0)],
  ]
  const signalsText = (r: ConsoleResident) => {
    const parts = [r.threads_open && `${r.threads_open} open`, r.threads_acknowledged && `${r.threads_acknowledged} seen by staff`, r.yearnings_open && `${r.yearnings_open} yearning${r.yearnings_open > 1 ? 's' : ''}`].filter(Boolean)
    return parts.length ? parts.join(' · ') : 'nothing open'
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div>
        <h1 className="text-[26px] font-semibold">{RESIDENT.organization_name}</h1>
        <p className="text-sm text-rw-muted">Care console · as of {fmtDate(asOf)}, 09:15</p>
      </div>

      <RWCard className="grid grid-cols-2 gap-4 p-5 md:grid-cols-5">
        {tiles.map(([k, v, sub]) => (
          <div key={k}>
            <div className="text-xs text-rw-muted">{k}</div>
            <div className="text-[28px] leading-tight font-bold">{v}</div>
            {sub && <div className="text-[11px] text-rw-faint">{sub}</div>}
          </div>
        ))}
      </RWCard>

      <RWCard className="p-5">
        <CardTitle>Watch rate</CardTitle>
        <div className="text-xl font-bold">{residentMonths ? `${((onWatch / residentMonths) * 100).toFixed(1)} per 100 resident-months` : 'No resident-months yet'}</div>
        <p className="mt-1 text-sm text-rw-muted">
          {onWatch} entries across {residentMonths.toFixed(0)} resident-months. Watch is a display state, not an alert. Nothing on this page is a medical or cognitive finding.
        </p>
      </RWCard>

      <RWCard className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[22px] font-bold">Today's worklist</h2>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, room or unit" className="w-64 rounded-lg border border-rw-line px-3 py-1.5 text-sm" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b border-rw-line text-left text-xs text-rw-muted">
              <tr>
                {['Resident', 'Call length', 'Warmth', 'Watch', 'Signals', 'Responsible'].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map(({ r, cl, wa, watch, sinceDate }) => {
                const featured = r.id === RESIDENT.id
                return (
                  <Fragment key={r.id}>
                    <tr className="border-b border-rw-line/70 align-top">
                      <td className="px-3 py-3">
                        {featured ? (
                          <button onClick={() => openCall(null)} className="font-semibold text-rw-captured hover:underline">
                            {r.first_name} {r.last_name}
                          </button>
                        ) : (
                          <span className="font-semibold">
                            {r.first_name} {r.last_name}
                          </span>
                        )}
                        <div className="text-xs text-rw-muted">
                          Room {r.room_number} · {r.unit_name} · {CARE_LEVEL[r.care_level]}
                        </div>
                        <div className="text-xs text-rw-faint">{r.sessions} sessions</div>
                      </td>
                      <td className="px-3 py-3">
                        <TrendCell t={cl} kind="call" />
                      </td>
                      <td className="px-3 py-3">
                        <TrendCell t={wa} kind="warmth" />
                      </td>
                      <td className="px-3 py-3">{watch.on ? <Badge tone="ochre">On Watch since {fmtDate(sinceDate, { day: 'numeric', month: 'short' })}</Badge> : <span className="text-xs text-rw-faint">—</span>}</td>
                      <td className="px-3 py-3 text-xs">
                        {featured ? (
                          <button onClick={() => setOpenSignals(openSignals === r.id ? null : r.id)} className="font-medium text-rw-captured hover:underline">
                            {signalsText(r)}
                          </button>
                        ) : (
                          <span className="text-rw-muted">{signalsText(r)}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-rw-muted">{r.assignee ?? '—'}</td>
                    </tr>
                    {openSignals === r.id && (
                      <tr>
                        <td colSpan={6} className="bg-rw-soft p-4">
                          <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                            {r.first_name} {r.last_name}
                            <button onClick={() => setTab('biosketch')} className="text-xs font-medium text-rw-captured hover:underline">
                              Open her biosketch →
                            </button>
                          </div>
                          <MomentsPanel quotes={canHearAndRead(viewer, consent)} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
              {!shown.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-rw-faint">
                    No resident matches.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-rw-faint">
          Sorted: on Watch first, then anyone with a trend below her baseline, then by last name. Each baseline is the median of that resident's own first {ANCHOR_N} sessions and never moves; a session counts as below it at under {Math.round(LOW_RATIO * 100)}% in this demo.
          If a resident were viewing her own row, her warmth and Watch state would read “Not shown to the resident”.
        </p>
      </RWCard>
    </div>
  )
}
