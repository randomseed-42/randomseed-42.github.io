import { useMemo, useRef, useState, type PointerEvent as RPointerEvent, type WheelEvent as RWheelEvent } from 'react'
import { useRW } from '../store'
import { RESIDENT, TOTAL_WEEKS } from '../data/resident'
import { CHAPTERS, EDGES, NODES } from '../data/graph'
import type { Chapter, EntityKind, GraphNode } from '../data/types'
import { mayEditChapters } from '../lib/access'
import { fmtDate, weekDate } from '../lib/growth'
import { mulberry32 } from '../../shared/rng'
import { cx } from '../../shared/ui'
import { Badge, CardTitle, Empty, KIND_COLOR, CHAPTER_PALETTE, Quote, RWButton, RWCard } from './ui'

const W = 1000
const H = 680
const UNASSIGNED = '#b9c3cc'
const KIND_LABEL: Record<EntityKind, string> = { person: 'People', event: 'Events', place: 'Places', organization: 'Organizations' }

const chaptersSorted = [...CHAPTERS].sort((a, b) => a.start_year - b.start_year)
export const chapterColor = (id: string | null) => (id ? CHAPTER_PALETTE[chaptersSorted.findIndex((c) => c.id === id) % CHAPTER_PALETTE.length] : UNASSIGNED)

/**
 * Deterministic force layout, computed once. The product lays the graph out on the server
 * (viz_x/viz_y) so positions are stable between visits; here chapters are seeded around a
 * ring in life order and a spring/repulsion pass settles the rest.
 */
const LAYOUT = (() => {
  const rng = mulberry32(7)
  const n = NODES.length
  const idx = new Map(NODES.map((nd, i) => [nd.name, i]))
  const pos = NODES.map((nd) => {
    const ci = nd.chapter ? chaptersSorted.findIndex((c) => c.id === nd.chapter) : -1
    const ang = ci < 0 ? rng() * Math.PI * 2 : (ci / chaptersSorted.length) * Math.PI * 2 - Math.PI / 2
    const r = ci < 0 ? 60 + rng() * 60 : 250
    return { x: W / 2 + Math.cos(ang) * r * 1.3 + (rng() - 0.5) * 80, y: H / 2 + Math.sin(ang) * r + (rng() - 0.5) * 80, vx: 0, vy: 0 }
  })
  const anchors = NODES.map((nd) => {
    const ci = nd.chapter ? chaptersSorted.findIndex((c) => c.id === nd.chapter) : -1
    if (ci < 0) return { x: W / 2, y: H / 2 }
    const ang = (ci / chaptersSorted.length) * Math.PI * 2 - Math.PI / 2
    return { x: W / 2 + Math.cos(ang) * 330, y: H / 2 + Math.sin(ang) * 230 }
  })
  const links = EDGES.map((e) => [idx.get(e.source), idx.get(e.target)]).filter((l): l is [number, number] => l[0] !== undefined && l[1] !== undefined)
  for (let it = 0; it < 260; it++) {
    const alpha = 1 - it / 260
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const dx = pos[j].x - pos[i].x
        const dy = pos[j].y - pos[i].y
        const d2 = Math.max(dx * dx + dy * dy, 25)
        if (d2 > 40000) continue
        const f = (900 / d2) * alpha
        pos[i].vx -= dx * f * 0.05
        pos[i].vy -= dy * f * 0.05
        pos[j].vx += dx * f * 0.05
        pos[j].vy += dy * f * 0.05
      }
    for (const [a, b] of links) {
      const dx = pos[b].x - pos[a].x
      const dy = pos[b].y - pos[a].y
      const d = Math.sqrt(dx * dx + dy * dy) || 1
      const f = ((d - 55) / d) * 0.04 * alpha
      pos[a].vx += dx * f
      pos[a].vy += dy * f
      pos[b].vx -= dx * f
      pos[b].vy -= dy * f
    }
    pos.forEach((p, i) => {
      p.vx += (anchors[i].x - p.x) * 0.012 * alpha
      p.vy += (anchors[i].y - p.y) * 0.012 * alpha
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.6
      p.vy *= 0.6
      p.x = Math.max(20, Math.min(W - 20, p.x))
      p.y = Math.max(20, Math.min(H - 20, p.y))
    })
  }
  const degree = new Map<string, number>()
  EDGES.forEach((e) => {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1)
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1)
  })
  return new Map(NODES.map((nd, i) => [nd.name, { x: pos[i].x, y: pos[i].y, importance: (degree.get(nd.name) ?? 0) + nd.discussed_count * 1.5 + nd.relation_to_holder.length * 3 }]))
})()

const PHRASE: Record<string, (f: string) => string> = {
  has_child: (f) => `child of ${f}`,
  has_parent: (f) => `parent of ${f}`,
  has_spouse: (f) => `spouse of ${f}`,
  has_sibling: (f) => `sibling of ${f}`,
  has_relative: (f) => `relative of ${f}`,
  has_friend: (f) => `friend of ${f}`,
  knows: (f) => `someone ${f} knew`,
  lives_in: (f) => `where ${f} lived`,
  born_in: (f) => `where ${f} was born`,
  works_at: (f) => `where ${f} worked`,
  member_of: (f) => `${f} was a member`,
  attended_school: (f) => `where ${f} went to school`,
  attended: (f) => `${f} was there`,
  participated_in: (f) => `${f} took part`,
  died_in: (f) => `where ${f}'s loved one died`,
  related_to: (f) => `connected to ${f}`,
}

function chapterYears(c: Chapter) {
  return `${c.start_year}–${c.end_year}`
}

export default function MemoryGraph() {
  const { week, viewer } = useRW()
  const first = RESIDENT.first_name
  const mayWrite = mayEditChapters(viewer)
  const [selected, setSelected] = useState<string | null>(null)
  const [chapterFilter, setChapterFilter] = useState<string | 'none' | null>(null)
  const [hiddenKinds, setHiddenKinds] = useState<EntityKind[]>([])
  const [statusOverride, setStatusOverride] = useState<Record<string, 'confirmed' | 'rejected'>>({})
  const [assignOverride, setAssignOverride] = useState<Record<string, string | null>>({})
  const [view, setView] = useState({ x: 0, y: 0, k: 1 })
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const chapters: Chapter[] = chaptersSorted.filter((c) => statusOverride[c.id] !== 'rejected').map((c) => ({ ...c, status: statusOverride[c.id] === 'confirmed' ? 'confirmed' : c.status }))
  const chapterOf = (n: GraphNode) => {
    const id = n.name in assignOverride ? assignOverride[n.name] : n.chapter
    return id && chapters.some((c) => c.id === id) ? id : null
  }

  const asOf = useMemo(() => NODES.filter((n) => n.first_seen_week <= week), [week])
  const visible = asOf.filter((n) => !hiddenKinds.includes(n.kind) && (chapterFilter === null || (chapterFilter === 'none' ? chapterOf(n) === null : chapterOf(n) === chapterFilter)))
  const visibleSet = new Set(visible.map((n) => n.name))
  const edges = EDGES.filter((e) => visibleSet.has(e.source) && visibleSet.has(e.target))
  const neighbours = useMemo(() => {
    if (!selected) return null
    const s = new Set([selected])
    EDGES.forEach((e) => {
      if (e.source === selected) s.add(e.target)
      if (e.target === selected) s.add(e.source)
    })
    return s
  }, [selected])

  // Label the most important nodes; zooming in reveals more.
  const labelBudget = Math.round(28 * view.k * view.k)
  const labelled = new Set([...visible].sort((a, b) => LAYOUT.get(b.name)!.importance - LAYOUT.get(a.name)!.importance).slice(0, labelBudget).map((n) => n.name))
  const node = selected ? NODES.find((n) => n.name === selected) : null

  const onWheel = (e: RWheelEvent) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * W
    const my = ((e.clientY - rect.top) / rect.height) * H
    const k = Math.max(0.6, Math.min(4, view.k * (e.deltaY < 0 ? 1.15 : 1 / 1.15)))
    setView({ k, x: mx - ((mx - view.x) * k) / view.k, y: my - ((my - view.y) * k) / view.k })
  }
  const onDown = (e: RPointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }
  }
  const onMove = (e: RPointerEvent) => {
    if (!drag.current) return
    const rect = svgRef.current!.getBoundingClientRect()
    setView((v) => ({ ...v, x: drag.current!.vx + ((e.clientX - drag.current!.x) / rect.width) * W, y: drag.current!.vy + ((e.clientY - drag.current!.y) / rect.height) * H }))
  }

  const countBy = (id: string | null) => asOf.filter((n) => chapterOf(n) === id).length

  return (
    <div>
      {/* ---------------------------------------------------------- legend */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {chapters.map((c) => (
          <button
            key={c.id}
            onClick={() => setChapterFilter(chapterFilter === c.id ? null : c.id)}
            title={`${chapterYears(c)} · ${(countBy(c.id) / Math.max(1, c.end_year - c.start_year)).toFixed(1)} memories per year`}
            className={cx('flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm transition', chapterFilter === c.id ? 'border-rw-ink' : 'border-rw-line hover:border-rw-faint', chapterFilter && chapterFilter !== c.id && 'opacity-50')}
          >
            <span className="h-3 w-3 rounded-full" style={{ background: chapterColor(c.id), opacity: c.status === 'proposed' ? 0.6 : 1 }} />
            {c.name}
            {c.status === 'proposed' && <span className="text-[10px] text-rw-faint">proposed</span>}
            <b>{countBy(c.id)}</b>
          </button>
        ))}
        <button
          onClick={() => setChapterFilter(chapterFilter === 'none' ? null : 'none')}
          className={cx('flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm', chapterFilter === 'none' ? 'border-rw-ink' : 'border-rw-line')}
        >
          <span className="h-3 w-3 rounded-full" style={{ background: UNASSIGNED }} />
          Not yet in a chapter <b>{countBy(null)}</b>
        </button>
        <div className="ml-auto flex flex-wrap gap-3 text-sm">
          {(Object.keys(KIND_LABEL) as EntityKind[]).map((k) => (
            <label key={k} className="flex items-center gap-1.5 text-rw-muted">
              <input type="checkbox" checked={!hiddenKinds.includes(k)} onChange={() => setHiddenKinds((h) => (h.includes(k) ? h.filter((x) => x !== k) : [...h, k]))} className="accent-[#1e63b4]" />
              {KIND_LABEL[k]}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] [&>*]:min-w-0">
        {/* ---------------------------------------------------------- canvas */}
        <RWCard className="relative overflow-hidden">
          <div className="absolute top-3 left-3 z-10 rounded-lg border border-rw-line bg-white/90 px-3 py-1.5 text-xs text-rw-muted backdrop-blur">
            As of week {week} of {TOTAL_WEEKS}: {asOf.length} of {NODES.length} memories
          </div>
          <div className="absolute top-3 right-3 z-10 flex gap-1">
            <button onClick={() => setView((v) => ({ ...v, k: Math.min(4, v.k * 1.25) }))} className="h-7 w-7 rounded-md border border-rw-line bg-white text-sm">
              +
            </button>
            <button onClick={() => setView((v) => ({ ...v, k: Math.max(0.6, v.k / 1.25) }))} className="h-7 w-7 rounded-md border border-rw-line bg-white text-sm">
              −
            </button>
            <button onClick={() => setView({ x: 0, y: 0, k: 1 })} className="h-7 rounded-md border border-rw-line bg-white px-2 text-xs">
              reset
            </button>
          </div>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="h-[460px] w-full cursor-grab touch-none select-none active:cursor-grabbing sm:h-[620px]"
            onWheel={onWheel}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={() => (drag.current = null)}
            onPointerLeave={() => (drag.current = null)}
            onClick={(e) => e.target === svgRef.current && setSelected(null)}
          >
            <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
              {edges.map((e, i) => {
                const a = LAYOUT.get(e.source)!
                const b = LAYOUT.get(e.target)!
                const on = !neighbours || (neighbours.has(e.source) && neighbours.has(e.target) && (e.source === selected || e.target === selected))
                return (
                  <line
                    key={i}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={e.predicate === 'co_mentioned' ? '#d5dbe1' : '#b9c3cc'}
                    strokeWidth={(e.predicate === 'co_mentioned' ? 0.6 : 1) / view.k}
                    strokeDasharray={e.predicate === 'co_mentioned' ? `${3 / view.k} ${3 / view.k}` : undefined}
                    opacity={on ? 0.9 : 0.12}
                  />
                )
              })}
              {visible.map((n) => {
                const p = LAYOUT.get(n.name)!
                const ch = chapterOf(n)
                const chObj = chapters.find((c) => c.id === ch)
                const r = (3 + Math.sqrt(p.importance) * 1.3) / Math.sqrt(view.k)
                const dim = neighbours && !neighbours.has(n.name)
                return (
                  <g
                    key={n.name}
                    opacity={dim ? 0.15 : 1}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelected(n.name)
                    }}
                    className="cursor-pointer"
                  >
                    <circle cx={p.x} cy={p.y} r={r} fill={chapterColor(ch)} fillOpacity={chObj?.status === 'proposed' ? 0.6 : 1} stroke={selected === n.name ? '#132339' : '#fff'} strokeWidth={(selected === n.name ? 2.5 : 1) / view.k} />
                    {(labelled.has(n.name) || selected === n.name || neighbours?.has(n.name)) && (
                      <text x={p.x + r + 3 / view.k} y={p.y + 4 / view.k} fontSize={12 / view.k} fill="#36414c" fontFamily="Montserrat, sans-serif" stroke="#fff" strokeWidth={3 / view.k} paintOrder="stroke">
                        {n.display_name}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          </svg>
          <div className="flex flex-wrap justify-between gap-2 border-t border-rw-line px-4 py-2 text-xs text-rw-muted">
            <span>
              {visible.length} memories · {edges.length} connections · {Math.min(labelled.size, visible.length)} of {visible.length} named{labelled.size < visible.length && ' — zoom in for the rest'}
            </span>
            <span>drag to pan · scroll to zoom · click a memory · click empty space to clear</span>
          </div>
        </RWCard>

        {/* ---------------------------------------------------------- side column */}
        <div className="space-y-5">
          <RWCard className="p-5">
            <CardTitle>Node detail</CardTitle>
            {!node ? (
              <>
                <div className="font-semibold">Select a memory</div>
                <p className="mt-1 text-sm text-rw-muted">Click a node to see how it connects to {first}'s life.</p>
              </>
            ) : (
              <NodeDetail
                node={node}
                chapterId={chapterOf(node)}
                chapters={chapters}
                mayWrite={mayWrite}
                onAssign={(id) => setAssignOverride((o) => ({ ...o, [node.name]: id }))}
                onSelect={setSelected}
              />
            )}
          </RWCard>

          <RWCard className="p-5">
            <CardTitle aside={`${chapters.length} · ${chapters.filter((c) => c.status === 'proposed').length} proposed`}>Chapters</CardTitle>
            <div className="space-y-2.5">
              {chapters.map((c) => {
                const n = countBy(c.id)
                const span = Math.max(1, c.end_year - c.start_year)
                const anchorA = NODES.find((x) => x.name === c.start_anchor)?.display_name
                const anchorB = NODES.find((x) => x.name === c.end_anchor)?.display_name
                return (
                  <div key={c.id} className="rounded-lg border border-rw-line p-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: chapterColor(c.id), opacity: c.status === 'proposed' ? 0.6 : 1 }} />
                      <span className="text-sm font-semibold">{c.name}</span>
                      {c.status === 'proposed' && <Badge tone="caution">proposed</Badge>}
                    </div>
                    <div className="mt-1 text-xs text-rw-muted">
                      {anchorA && anchorB ? `from ${anchorA} until ${anchorB} · ` : ''}
                      {chapterYears(c)} · {n} memories · {(n / span).toFixed(1)}/yr
                    </div>
                    {c.narrative_summary && <p className="mt-1.5 text-xs leading-relaxed text-rw-muted">{c.narrative_summary}</p>}
                    {mayWrite && c.status === 'proposed' && (
                      <div className="mt-2 flex gap-2">
                        <RWButton variant="ghost" className="!py-1 !text-xs" onClick={() => setStatusOverride((s) => ({ ...s, [c.id]: 'confirmed' }))}>
                          Confirm
                        </RWButton>
                        <RWButton variant="link" className="!text-xs" onClick={() => setStatusOverride((s) => ({ ...s, [c.id]: 'rejected' }))}>
                          Not a chapter
                        </RWButton>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {!mayWrite && <p className="mt-3 text-xs text-rw-faint">Chapters are confirmed by {first} or her family.</p>}
          </RWCard>

          <RWCard className="p-5 text-sm text-rw-muted">
            {asOf.length} memories · {EDGES.filter((e) => asOf.some((n) => n.name === e.source) && asOf.some((n) => n.name === e.target)).length} connections ·{' '}
            {EDGES.filter((e) => e.predicate === 'co_mentioned').length} from shared mentions · {first} is the centre of this graph and is not drawn.
          </RWCard>
        </div>
      </div>
    </div>
  )
}

function NodeDetail({
  node,
  chapterId,
  chapters,
  mayWrite,
  onAssign,
  onSelect,
}: {
  node: GraphNode
  chapterId: string | null
  chapters: Chapter[]
  mayWrite: boolean
  onAssign: (id: string | null) => void
  onSelect: (name: string) => void
}) {
  const first = RESIDENT.first_name
  const ch = chapters.find((c) => c.id === chapterId)
  const connected = EDGES.filter((e) => e.source === node.name || e.target === node.name)
    .map((e) => ({ other: NODES.find((n) => n.name === (e.source === node.name ? e.target : e.source)), predicate: e.predicate }))
    .filter((c): c is { other: GraphNode; predicate: GraphNode['relation_to_holder'][number] } => !!c.other)
    .slice(0, 12)
  return (
    <div>
      <div className="text-[11px] font-bold tracking-wider uppercase" style={{ color: KIND_COLOR[node.kind] }}>
        {node.kind}
      </div>
      <div className="mt-0.5 text-lg font-semibold">{node.display_name}</div>
      {node.relation_to_holder.length > 0 && <div className="text-sm text-rw-muted">{node.relation_to_holder.map((r) => PHRASE[r]?.(first) ?? r.replace(/_/g, ' ')).join(' · ')}</div>}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="h-3 w-3 rounded-full" style={{ background: chapterColor(chapterId) }} />
        {ch ? (
          <span>
            {ch.name}
            {ch.status === 'proposed' && <span className="text-rw-faint"> (proposed)</span>}
          </span>
        ) : (
          <span className="text-rw-faint">Not yet in a chapter</span>
        )}
        {mayWrite && (
          <select value={chapterId ?? ''} onChange={(e) => onAssign(e.target.value || null)} className="ml-auto rounded-md border border-rw-line px-1.5 py-0.5 text-xs">
            <option value="">{ch ? 'remove' : 'Add to chapter'}</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {node.fact && <Quote>{node.fact}</Quote>}
      <p className="text-xs text-rw-faint">
        First mentioned {fmtDate(weekDate(node.first_seen_week))} · came up in {node.discussed_count} conversation{node.discussed_count === 1 ? '' : 's'}
        {node.year ? ` · dated ${node.year}` : ''}
      </p>
      {connected.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-bold tracking-wider text-rw-muted uppercase">Connected</div>
          <ul className="mt-1 space-y-0.5 text-sm">
            {connected.map(({ other, predicate }) => (
              <li key={other.name + predicate}>
                <button onClick={() => onSelect(other.name)} className="text-rw-captured hover:underline">
                  {other.display_name}
                </button>
                <span className="text-rw-faint"> · {predicate === 'co_mentioned' ? 'mentioned together' : predicate.replace(/_/g, ' ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!connected.length && <Empty>No other connections yet.</Empty>}
    </div>
  )
}
