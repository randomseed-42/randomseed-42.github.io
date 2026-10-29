import { useMemo, useState, type ReactNode } from 'react'
import { ChevronRight, Copy } from 'lucide-react'
import { MEMORIES, PRESET_QUERIES, TEAMS, type Memory } from '../data/memories'
import {
  SCOPES,
  SHARE_PRESETS,
  TIER_INFO,
  TIERS,
  assemble,
  classify,
  cost,
  hiddenReason,
  inScope,
  tierOf,
  title,
  type Block,
  type Modality,
  type Scope,
  type Scored,
  type Tier,
  type TierShares,
  type TierTrace,
} from '../lib/engine'
import { Card, cx } from '../../shared/ui'

export function TypeBadge({ m }: { m: Memory }) {
  const c = { episodic: 'text-sky-300 border-sky-400/30', semantic: 'text-emerald-300 border-emerald-400/30', procedural: 'text-violet-300 border-violet-400/30' }[m.type]
  return <span className={cx('rounded border px-1 py-px text-[10px] uppercase', c)}>{m.type.slice(0, 4)}</span>
}

export function VisBadge({ v }: { v: Memory['visibility'] }) {
  return <span className="rounded bg-aiv-raised px-1 py-px font-mono text-[10px] text-aiv-muted">{v}</span>
}

function Section({ title, aside, children, className }: { title: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cx('flex min-w-0 flex-col p-4', className)}>
      <div className="mb-3 flex items-baseline justify-between gap-2 border-b border-aiv-line pb-2">
        <h3 className="font-display text-base font-semibold tracking-wide">{title}</h3>
        {aside && <span className="text-[11px] text-aiv-faint">{aside}</span>}
      </div>
      {children}
    </Card>
  )
}

function Slider({ label, value, min, max, step = 1, onChange, suffix, disabled }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; suffix?: string; disabled?: boolean }) {
  return (
    <label className={cx('block text-xs', disabled && 'opacity-40')}>
      <span className="flex justify-between text-aiv-muted">
        {label}
        <span className="font-mono text-aiv-text">
          {value}
          {suffix}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-[#ff3366]" />
    </label>
  )
}

const SEGMENT_LABEL: Record<Block['segment'], string> = {
  self_start: 'self · top half',
  team: 'team',
  cross_team: 'cross-team',
  org: 'org',
  self_end: 'self · bottom half',
  all: 'single-agent order',
}

/** U-shaped attention curve with each block placed at its position. */
function AttentionCurve({ blocks, hover, setHover }: { blocks: Block[]; hover: string | null; setHover: (id: string | null) => void }) {
  const W = 520
  const H = 120
  const n = blocks.length
  const x = (i: number) => (n <= 1 ? W / 2 : 24 + (i / (n - 1)) * (W - 48))
  const attn = (t: number) => 0.25 + 0.75 * (2 * t - 1) ** 2
  const y = (t: number) => H - 22 - attn(t) * (H - 40)
  const path = Array.from({ length: 41 }, (_, i) => `${i ? 'L' : 'M'}${24 + (i / 40) * (W - 48)},${y(i / 40)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Attention by position">
      <path d={path} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={2} strokeDasharray="4 4" />
      <text x={24} y={12} fill="#64707f" fontSize={10}>
        high attention
      </text>
      <text x={W - 24} y={12} fill="#64707f" fontSize={10} textAnchor="end">
        high attention
      </text>
      <text x={W / 2} y={H - 4} fill="#64707f" fontSize={10} textAnchor="middle">
        ← start of prompt · lost in the middle · end of prompt →
      </text>
      {blocks.map((b, i) => {
        const cx_ = x(i)
        const cy = y(n <= 1 ? 0.5 : i / (n - 1))
        const on = hover === b.s.memory.id
        return (
          <g key={b.s.memory.id} onMouseEnter={() => setHover(b.s.memory.id)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
            <line x1={cx_} x2={cx_} y1={cy} y2={H - 22} stroke={TIER_INFO[b.tier].color} strokeOpacity={0.35} />
            <circle cx={cx_} cy={cy} r={on ? 9 : 7} fill={TIER_INFO[b.tier].color} stroke={on ? '#fff' : 'none'} strokeWidth={2} />
            <text x={cx_} y={cy + 3.5} fontSize={9} fontWeight={700} textAnchor="middle" fill="#0b1220">
              {b.position}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function CandidateRow({ s, agentId, hover, setHover, status }: { s: Scored; agentId: string; hover: string | null; setHover: (id: string | null) => void; status: 'in' | 'out' }) {
  const tier = tierOf(s.memory, agentId)
  const c = s.components
  return (
    <div
      onMouseEnter={() => setHover(s.memory.id)}
      onMouseLeave={() => setHover(null)}
      className={cx('rounded-md border px-2.5 py-1.5 transition', hover === s.memory.id ? 'border-aiv-text/50 bg-aiv-raised' : 'border-aiv-line bg-aiv-panel', status === 'out' && 'opacity-55')}
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: TIER_INFO[tier].color }} title={`${TIER_INFO[tier].label} tier`} />
        <span className="min-w-0 flex-1 truncate text-xs">{title(s.memory)}</span>
        <span className="font-mono text-[11px] text-aiv-muted">{s.score.toFixed(2)}</span>
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 pl-4 text-[10px] text-aiv-faint">
        <TypeBadge m={s.memory} />
        <span>{s.memory.agent_id}</span>
        {c.keywordRank && <span title={`keyword score ${c.keyword?.toFixed(2)}`}>kw #{c.keywordRank}</span>}
        {c.vectorRank && <span title={`vector cosine ${c.vector?.toFixed(2)}`}>vec #{c.vectorRank}</span>}
        {c.recency !== undefined && <span className="text-amber-300/80">recency</span>}
        <span className="ml-auto">{cost(s.memory)} words</span>
        {status === 'out' && <span className="text-red-300/80">dropped</span>}
      </div>
    </div>
  )
}

function TierPanel({ t, hover, setHover }: { t: TierTrace; hover: string | null; setHover: (id: string | null) => void }) {
  const info = t.tier === 'all' ? { label: 'All memories', color: '#ff5577' } : TIER_INFO[t.tier]
  const pct = t.budget ? (t.used / t.budget) * 100 : 0
  return (
    <div className="rounded-lg border border-aiv-line bg-aiv-panel p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: info.color }} />
          {info.label}
        </span>
        <span className="font-mono text-aiv-muted">
          {t.used} / {t.budget} words
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-aiv-raised">
        <div className="h-full" style={{ width: `${pct}%`, background: info.color }} />
      </div>
      {!t.included.length && !t.dropped.length && <div className="mt-2 text-[11px] text-aiv-faint">{t.budget ? 'No candidates in this tier.' : 'No budget allocated to this tier.'}</div>}
      <ul className="mt-2 space-y-0.5 text-[11px]">
        {t.included.map(({ s, cost: c, remainingAfter }) => (
          <li
            key={s.memory.id}
            onMouseEnter={() => setHover(s.memory.id)}
            onMouseLeave={() => setHover(null)}
            className={cx('flex gap-1.5 rounded px-1', hover === s.memory.id && 'bg-aiv-raised')}
          >
            <span className="text-green-300">✓</span>
            <span className="min-w-0 flex-1 truncate text-aiv-muted">{title(s.memory)}</span>
            <span className="shrink-0 font-mono text-aiv-faint">
              −{c} → {remainingAfter}
            </span>
          </li>
        ))}
        {t.dropped.map(({ s, cost: c, remaining }) => (
          <li
            key={s.memory.id}
            onMouseEnter={() => setHover(s.memory.id)}
            onMouseLeave={() => setHover(null)}
            className={cx('flex gap-1.5 rounded px-1', hover === s.memory.id && 'bg-aiv-raised')}
            title={`Needs ${c} words; only ${remaining} left in this tier`}
          >
            <span className="text-red-300">✗</span>
            <span className="min-w-0 flex-1 truncate text-aiv-faint line-through">{title(s.memory)}</span>
            <span className="shrink-0 font-mono text-red-300/70">
              {c} &gt; {remaining}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export interface InspectorPreset {
  query?: string
  budget?: number
  scope?: Scope
  presetId?: string
}

export default function Inspector({ agentId, initial }: { agentId: string; initial?: InspectorPreset }) {
  const [query, setQuery] = useState(initial?.query ?? PRESET_QUERIES[0])
  const [modality, setModality] = useState<Modality>('auto')
  const [rrfK, setRrfK] = useState(60)
  const [scope, setScope] = useState<Scope>(initial?.scope ?? 'ALL_VISIBLE')
  const [budget, setBudget] = useState(initial?.budget ?? 250)
  const [presetId, setPresetId] = useState(initial?.presetId ?? 'federated')
  const [shares, setShares] = useState<TierShares | null>(SHARE_PRESETS.find((p) => p.id === (initial?.presetId ?? 'federated'))!.shares)
  const [recency, setRecency] = useState(false)
  const [hardLimit, setHardLimit] = useState<number | null>(null)
  const [meta, setMeta] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const [showFusion, setShowFusion] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareSum = shares ? Math.round((shares.self + shares.team + shares.cross_team + shares.org + shares.reserve) * 100) / 100 : 1
  const valid = Math.abs(shareSum - 1) < 1e-6
  const result = useMemo(
    () => (valid && query.trim() ? assemble({ query, agentId, scope, modality, rrfK, limit: 50, budget, shares, recency, maxContextTokens: hardLimit, includeMetadata: meta }) : null),
    [query, agentId, scope, modality, rrfK, budget, shares, recency, hardLimit, meta, valid],
  )
  const auto = classify(query)
  const hidden = MEMORIES.filter((m) => hiddenReason(m, agentId))
  const outOfScope = MEMORIES.filter((m) => !hiddenReason(m, agentId) && !inScope(m, agentId, scope))
  const includedIds = new Set(result?.blocks.map((b) => b.s.memory.id))

  const setShare = (k: keyof TierShares, v: number) => {
    setPresetId('custom')
    setShares((s) => ({ ...(s ?? { self: 1, team: 0, cross_team: 0, org: 0, reserve: 0 }), [k]: v / 100 }))
  }
  const normalize = () => {
    if (!shares) return
    const total = shares.self + shares.team + shares.cross_team + shares.org + shares.reserve || 1
    const n = Object.fromEntries(Object.entries(shares).map(([k, v]) => [k, Math.round((v / total) * 100) / 100])) as unknown as TierShares
    n.reserve = Math.round((1 - n.self - n.team - n.cross_team - n.org) * 100) / 100
    setShares(n)
  }

  const stages = result
    ? [
        ['Retrieve', `${result.retrieval.results.length} via ${result.retrieval.modality}${result.recent.length ? ` + ${result.recent.length} recent` : ''}`],
        ['Merge & dedup', `${result.candidates.length} unique${result.duplicates ? ` (${result.duplicates} dup)` : ''}`],
        ['Allocate budget', `${result.traces.reduce((a, t) => a + t.included.length, 0)} fit · ${result.traces.reduce((a, t) => a + t.dropped.length, 0)} dropped`],
        ['Position', shares ? 'trust-aware U-order' : 'score order'],
        ['Condense', hardLimit === null ? 'off' : result.truncatedWords ? `truncated ${result.truncatedWords} words` : 'within limit'],
      ]
    : []

  return (
    <div className="space-y-4">
      <p className="max-w-4xl text-sm text-aiv-muted">
        <span className="text-aiv-text">What does the LLM actually see?</span> Each agent call to <code className="text-cyan-200">memory.assemble(query, budget)</code> retrieves
        memories the agent is allowed to see, splits a token budget across trust tiers, fills each tier by score, and orders the result so
        the agent's own strongest memories sit where models pay most attention. Change anything below and every stage updates.
      </p>

      {/* ---------------------------------------------------------------- controls */}
      <Card className="p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="min-w-0">
            <label className="text-xs text-aiv-muted">
              Query
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mt-1 w-full rounded-lg border border-aiv-line-strong bg-aiv-panel px-3 py-2 text-sm text-aiv-text outline-none focus:border-aiv-accent"
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-1">
              {PRESET_QUERIES.map((q) => (
                <button key={q} onClick={() => setQuery(q)} className={cx('rounded-full border px-2 py-0.5 text-[11px]', q === query ? 'border-aiv-accent text-aiv-accent-soft' : 'border-aiv-line text-aiv-faint hover:text-aiv-text')}>
                  {q}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-aiv-muted">Modality</span>
              <div className="flex overflow-hidden rounded-md border border-aiv-line-strong">
                {(['auto', 'keyword', 'vector', 'hybrid'] as Modality[]).map((m) => (
                  <button key={m} onClick={() => setModality(m)} className={cx('px-2 py-1', modality === m ? 'bg-aiv-raised text-aiv-text' : 'text-aiv-muted')}>
                    {m}
                  </button>
                ))}
              </div>
              {modality === 'auto' && (
                <span className="text-aiv-faint">
                  → <span className="text-aiv-text">{auto.modality}</span>: {auto.reason}
                </span>
              )}
            </div>
            <div className="mt-3 max-w-xs">
              <Slider label="RRF k (hybrid fusion)" value={rrfK} min={1} max={120} onChange={setRrfK} disabled={result?.retrieval.modality !== 'hybrid'} />
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <div>
              <div className="text-xs text-aiv-muted">Retrieval scope</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {SCOPES.map((s) => (
                  <button key={s} onClick={() => setScope(s)} className={cx('rounded border px-1.5 py-0.5 font-mono text-[10px]', scope === s ? 'border-aiv-accent bg-aiv-accent/10 text-aiv-text' : 'border-aiv-line text-aiv-faint hover:text-aiv-text')}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="mt-1 text-[11px] text-aiv-faint">Cumulative: each level includes the ones to its left. The library defaults to TEAM in team mode.</div>
            </div>
            <Slider label="Context budget" value={budget} min={40} max={700} step={10} onChange={setBudget} suffix=" words" />
            <label className="flex items-center gap-2 text-xs text-aiv-muted">
              <input type="checkbox" className="accent-[#ff3366]" checked={recency} onChange={(e) => setRecency(e.target.checked)} />
              Also select the 5 most recent memories (SelectByRecency)
            </label>
            <label className="flex items-center gap-2 text-xs text-aiv-muted">
              <input type="checkbox" className="accent-[#ff3366]" checked={hardLimit !== null} onChange={(e) => setHardLimit(e.target.checked ? 120 : null)} />
              Hard limit with truncation
              {hardLimit !== null && (
                <input type="number" min={10} value={hardLimit} onChange={(e) => setHardLimit(Math.max(10, Number(e.target.value) || 10))} className="w-16 rounded border border-aiv-line-strong bg-aiv-panel px-1 py-0.5 text-aiv-text" />
              )}
            </label>
            <label className="flex items-center gap-2 text-xs text-aiv-muted">
              <input type="checkbox" className="accent-[#ff3366]" checked={meta} onChange={(e) => setMeta(e.target.checked)} />
              Include metadata lines in context
            </label>
          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-between text-xs text-aiv-muted">
              Tier budget shares
              <select
                value={presetId}
                onChange={(e) => {
                  const p = SHARE_PRESETS.find((x) => x.id === e.target.value)
                  if (!p) return
                  setPresetId(p.id)
                  setShares(p.shares)
                }}
                className="rounded border border-aiv-line-strong bg-aiv-panel px-1.5 py-1 text-xs text-aiv-text"
              >
                {SHARE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
                {presetId === 'custom' && <option value="custom">Custom</option>}
              </select>
            </div>
            {shares ? (
              <>
                <div className="mt-2 flex h-3 overflow-hidden rounded">
                  {TIERS.map((t) => (
                    <div key={t} style={{ width: `${shares[t] * 100}%`, background: TIER_INFO[t].color }} title={`${TIER_INFO[t].label} ${Math.round(shares[t] * 100)}%`} />
                  ))}
                  <div style={{ width: `${shares.reserve * 100}%` }} className="bg-aiv-raised" title="reserve" />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {[...TIERS, 'reserve' as const].map((t) => (
                    <Slider key={t} label={t === 'reserve' ? 'Reserve' : TIER_INFO[t].label} value={Math.round(shares[t] * 100)} min={0} max={100} onChange={(v) => setShare(t, v)} suffix="%" />
                  ))}
                </div>
                {!valid && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-red-300">
                    Tier budget shares must sum to 1.0, got {shareSum}
                    <button onClick={normalize} className="rounded border border-aiv-line-strong px-1.5 py-0.5 text-aiv-text">
                      Normalize
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-2 text-xs text-aiv-faint">No tier config: everything competes for the full budget in score order, as in single-agent mode.</p>
            )}
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------------------- pipeline strip */}
      {result && (
        <div className="flex flex-wrap items-stretch gap-1">
          {stages.map(([name, detail], i) => (
            <div key={name} className="flex items-center gap-1">
              <div className="rounded-lg border border-aiv-line bg-aiv-surface px-3 py-1.5">
                <div className="text-[11px] font-semibold">{name}</div>
                <div className="font-mono text-[10px] text-aiv-muted">{detail}</div>
              </div>
              {i < stages.length - 1 && <ChevronRight size={14} className="text-aiv-faint" />}
            </div>
          ))}
        </div>
      )}

      {result && <Callouts result={result} />}

      {!result && <Card className="p-6 text-sm text-aiv-muted">{!valid ? 'Fix the tier shares to run assembly.' : 'Enter a query.'}</Card>}

      {result && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.25fr)] [&>*]:min-w-0">
          {/* ---------------------------------------------------------- 1. candidates */}
          <Section title={`1 · Retrieved (${result.candidates.length})`} aside={`${result.retrieval.poolSize} memories in scope`}>
            <div className="max-h-[560px] space-y-1 overflow-y-auto pr-1">
              {result.candidates.map((s) => (
                <CandidateRow key={s.memory.id} s={s} agentId={agentId} hover={hover} setHover={setHover} status={includedIds.has(s.memory.id) ? 'in' : 'out'} />
              ))}
              {!result.candidates.length && <p className="text-xs text-aiv-faint">Nothing matched. Try another modality or a wider scope.</p>}
            </div>
            {result.retrieval.modality === 'hybrid' && (
              <div className="mt-3">
                <button onClick={() => setShowFusion((x) => !x)} className="text-xs text-aiv-accent-soft hover:underline">
                  {showFusion ? 'Hide' : 'Show'} how hybrid fused the rankings
                </button>
                {showFusion && (
                  <table className="mt-2 w-full text-[11px]">
                    <thead className="text-aiv-faint">
                      <tr>
                        <th className="text-left font-normal">memory</th>
                        <th className="text-right font-normal">kw rank</th>
                        <th className="text-right font-normal">vec rank</th>
                        <th className="text-right font-normal">Σ 1/(k+r)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.retrieval.results.slice(0, 12).map((s) => (
                        <tr key={s.memory.id} className="border-t border-aiv-line">
                          <td className="max-w-[160px] truncate py-0.5 text-aiv-muted">{title(s.memory)}</td>
                          <td className="text-right font-mono">{s.components.keywordRank ?? '—'}</td>
                          <td className="text-right font-mono">{s.components.vectorRank ?? '—'}</td>
                          <td className="text-right font-mono">{s.components.rrf?.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-aiv-muted">
                {hidden.length} not visible to {agentId}
                {outOfScope.length > 0 && `, ${outOfScope.length} outside ${scope} scope`}
              </summary>
              <ul className="mt-2 space-y-1">
                {hidden.map((m) => (
                  <li key={m.id} className="flex gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 translate-y-1.5 rounded-full" style={{ background: TEAMS[m.team_id].color }} />
                    <span className="min-w-0 flex-1 truncate text-aiv-faint italic">
                      {m.type} memory by {m.agent_id} (content withheld)
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-red-300/70">{hiddenReason(m, agentId)}</span>
                  </li>
                ))}
                {outOfScope.map((m) => (
                  <li key={m.id} className="flex gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 translate-y-1.5 rounded-full" style={{ background: TEAMS[m.team_id].color }} />
                    <span className="min-w-0 flex-1 truncate text-aiv-faint">{title(m)}</span>
                    <span className="shrink-0 font-mono text-[10px] text-amber-300/70">outside scope</span>
                  </li>
                ))}
              </ul>
            </details>
          </Section>

          {/* ---------------------------------------------------------- 2. budget */}
          <Section title="2 · Budget by tier" aside={`${budget} words total`}>
            <div className="space-y-2">
              {result.traces.map((t) => (
                <TierPanel key={t.tier} t={t} hover={hover} setHover={setHover} />
              ))}
              {shares && shares.reserve > 0 && (
                <div className="rounded-lg border border-dashed border-aiv-line-strong px-3 py-2 text-xs text-aiv-faint">
                  Reserve: {Math.floor(budget * shares.reserve)} words held back for the prompt and the model's reply
                </div>
              )}
            </div>
            <p className="mt-3 text-[11px] text-aiv-faint">
              Each tier is filled greedily by score. A memory that doesn't fit is skipped and smaller, lower-scoring ones can still get in; unused budget is not passed to other tiers.
            </p>
          </Section>

          {/* ---------------------------------------------------------- 3. final context */}
          <Section
            title={`3 · Final context (${result.blocks.length} memories)`}
            aside={
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(result.output)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1200)
                }}
                className="flex items-center gap-1 text-aiv-muted hover:text-aiv-text"
              >
                <Copy size={12} /> {copied ? 'copied' : 'copy'}
              </button>
            }
          >
            <AttentionCurve blocks={result.blocks} hover={hover} setHover={setHover} />
            <div className="mt-1 mb-3 flex flex-wrap gap-3 text-[11px] text-aiv-faint">
              {TIERS.map((t) => (
                <span key={t} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: TIER_INFO[t].color }} />
                  {TIER_INFO[t].label}
                </span>
              ))}
              <span className="ml-auto font-mono">
                {result.fullWords} words{result.truncatedWords ? ` → ${hardLimit} after truncation` : ''}
              </span>
            </div>
            <div className="max-h-[440px] space-y-0 overflow-y-auto rounded-lg border border-aiv-line bg-aiv-bg font-mono text-[11px] leading-relaxed">
              {result.blocks.map((b, i) => {
                const cut = result.truncatedWords > 0 && result.output.length < result.blocks.slice(0, i + 1).map((x) => x.text).join('\n---\n').length
                return (
                  <div key={b.s.memory.id}>
                    {i > 0 && <div className="px-3 text-aiv-faint">---</div>}
                    <div
                      onMouseEnter={() => setHover(b.s.memory.id)}
                      onMouseLeave={() => setHover(null)}
                      className={cx('border-l-4 px-3 py-1.5 transition-colors', hover === b.s.memory.id && 'bg-aiv-raised', cut && 'opacity-35')}
                      style={{ borderColor: TIER_INFO[b.tier].color }}
                    >
                      <div className="mb-0.5 font-sans text-[10px] text-aiv-faint">
                        #{b.position} · {SEGMENT_LABEL[b.segment]} · {b.s.memory.agent_id} · score {b.s.score.toFixed(2)}
                        {cut && <span className="ml-1 text-red-300">· truncated</span>}
                      </div>
                      <div className="whitespace-pre-wrap text-cyan-100/90">{b.text}</div>
                    </div>
                  </div>
                )
              })}
              {!result.blocks.length && <div className="p-3 text-aiv-faint">Empty context: nothing fit the budget.</div>}
            </div>
          </Section>
        </div>
      )}

    </div>
  )
}

/** Plain-language notes on what this configuration did. */
function Callouts({ result }: { result: NonNullable<ReturnType<typeof assemble>> }) {
  const notes: string[] = []
  const org = MEMORIES.find((m) => m.consolidation_level === 'ORGANIZATION')!
  const dropped = result.traces.flatMap((t) => t.dropped.map((d) => ({ ...d, tier: t.tier })))
  const bestDropped = dropped.sort((a, b) => b.s.score - a.s.score)[0]
  const orgDropped = dropped.find((d) => d.s.memory.id === org.id)
  if (orgDropped)
    notes.push(
      `The organisation-level insight, which states the actual root cause, scored ${orgDropped.s.score.toFixed(2)} but didn't fit: it needs ${orgDropped.cost} words and the org tier had ${orgDropped.remaining} left. Raise the org share or the total budget.`,
    )
  else if (bestDropped)
    notes.push(
      `“${title(bestDropped.s.memory)}” scored ${bestDropped.s.score.toFixed(2)} but was dropped: it costs ${bestDropped.cost} words and its ${bestDropped.tier === 'all' ? '' : TIER_INFO[bestDropped.tier as Tier].label.toLowerCase() + ' '}tier had ${bestDropped.remaining} left.`,
    )
  const conflicting = ['ben-04', 'eli-04'].every((id) => result.blocks.some((b) => b.s.memory.id === id))
  if (conflicting) notes.push('The context contains two contradicting facts about ERR-4071 (card issuer vs gateway timeout). Memento’s conflict detector classifies pairs like this for review.')
  if (!result.candidates.length) notes.push('Nothing retrieved. Keyword search requires query words to appear in the memory; try hybrid or vector.')
  if (!notes.length) return null
  return (
    <div className="space-y-2">
      {notes.map((n) => (
        <div key={n} className="rounded-lg border border-aiv-info/30 bg-aiv-info/10 px-4 py-2.5 text-sm text-aiv-muted">
          {n}
        </div>
      ))}
    </div>
  )
}
