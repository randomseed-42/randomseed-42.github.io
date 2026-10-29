// "From incident to insight": a guided walk through Memento's capability stack in seven
// acts, following the library's own narrated example, on this demo's fictional incident.

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { AGENTS, MEMORIES, TEAMS, type Memory } from '../data/memories'
import { SHARE_PRESETS, TIER_INFO, assemble, cost, hiddenReason, title } from '../lib/engine'
import { Button, Card, cx } from '../../shared/ui'
import { TypeBadge, VisBadge, type InspectorPreset } from './Inspector'
import { LineageNode, countLeaves } from './Lineage'

const byId = new Map(MEMORIES.map((m) => [m.id, m]))
const RAW = MEMORIES.filter((m) => m.source_pipeline === 'formation')
const get = (id: string) => byId.get(id)!

export type Jump = { view: 'inspector'; agentId: string; preset: InspectorPreset } | { view: 'lineage'; agentId: string; root: string } | { view: 'memories'; agentId: string }

function Mini({ m, delay = 0, dim, highlight }: { m: Memory; delay?: number; dim?: boolean; highlight?: string }) {
  return (
    <div
      className={cx('animate-fade-up rounded-lg border bg-aiv-panel px-3 py-2', dim && 'opacity-50', highlight ? '' : 'border-aiv-line')}
      style={{ animationDelay: `${delay}ms`, borderLeft: `3px solid ${TEAMS[m.team_id].color}`, ...(highlight ? { borderColor: highlight, borderLeftColor: TEAMS[m.team_id].color } : {}) }}
    >
      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="font-mono text-aiv-muted">{m.agent_id}</span>
        <TypeBadge m={m} />
        <VisBadge v={m.visibility} />
        {m.consolidation_level && (
          <span className="rounded border border-aiv-accent/40 px-1 text-aiv-accent-soft">
            {m.consolidation_level} · {m.specialist}
          </span>
        )}
      </div>
      <div className="mt-1 text-xs leading-snug">{title(m)}</div>
    </div>
  )
}

function Report({ title: t, rows, color = 'border-aiv-ok/40' }: { title: string; rows: [string, ReactNode][]; color?: string }) {
  return (
    <div className={cx('animate-fade-up rounded-lg border bg-aiv-bg p-3 font-mono text-[11px]', color)} style={{ animationDelay: '300ms' }}>
      <div className="mb-1.5 font-sans text-xs font-semibold text-aiv-text">{t}</div>
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4">
          <span className="text-aiv-faint">{k}</span>
          <span className="text-right text-cyan-100/90">{v}</span>
        </div>
      ))}
    </div>
  )
}

/** Sources on the left fold into a derived memory on the right. */
function Derivation({ derived, note }: { derived: Memory; note?: ReactNode }) {
  const sources = derived.source_ids!.map(get)
  return (
    <div className="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)]">
      <div className="space-y-1.5">
        {sources.map((s, i) => (
          <Mini key={s.id} m={s} delay={i * 70} />
        ))}
      </div>
      <ArrowRight className="mx-auto hidden text-aiv-accent-soft md:block" size={22} />
      <div className="space-y-2">
        <div className="animate-fade-up" style={{ animationDelay: `${sources.length * 70 + 150}ms` }}>
          <div className="rounded-lg border-2 border-aiv-accent/60 bg-aiv-accent/5 p-3">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="font-mono text-aiv-muted">{derived.agent_id}</span>
              <TypeBadge m={derived} />
              <VisBadge v={derived.visibility} />
            </div>
            <div className="mt-1 text-sm font-medium">{derived.summary}</div>
            <div className="mt-1 text-xs leading-relaxed text-aiv-muted">{derived.details}</div>
          </div>
        </div>
        {note}
      </div>
    </div>
  )
}

function ContextColumn({ label, blocks, words, budget, highlight }: { label: string; blocks: ReturnType<typeof assemble>['blocks']; words: number; budget: number; highlight: Record<string, string> }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-display text-base font-semibold">{label}</span>
        <span className="font-mono text-[11px] text-aiv-faint">
          {blocks.length} memories · {words}/{budget} words
        </span>
      </div>
      <ol className="space-y-1">
        {blocks.map((b) => {
          const h = highlight[b.s.memory.id]
          return (
            <li key={b.s.memory.id} className={cx('flex items-start gap-2 rounded-md border px-2 py-1.5 text-xs', h ? 'border-transparent' : 'border-aiv-line bg-aiv-panel')} style={h ? { background: `${h}22`, borderColor: `${h}88` } : undefined}>
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold text-black" style={{ background: TIER_INFO[b.tier].color }}>
                {b.position}
              </span>
              <span className="min-w-0 flex-1">{title(b.s.memory)}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Payoff({ onJump }: { onJump: (j: Jump) => void }) {
  const [budget, setBudget] = useState(350)
  const base = { query: 'Why is checkout failing with ERR-4071?', agentId: 'cara', scope: 'ALL_VISIBLE' as const, modality: 'auto' as const, rrfK: 60, limit: 50, budget, shares: SHARE_PRESETS[2].shares, recency: false, maxContextTokens: null, includeMetadata: false }
  const before = useMemo(() => assemble({ ...base, exclude: (m) => m.source_pipeline === 'consolidation' }), [budget]) // eslint-disable-line react-hooks/exhaustive-deps
  const after = useMemo(() => assemble(base), [budget]) // eslint-disable-line react-hooks/exhaustive-deps
  const hl = { 'org-1': '#28a745', 'ben-04': '#dc3545', 'eli-04': '#ffc107' }
  const insightIn = after.blocks.some((b) => b.s.memory.id === 'org-1')
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-xs text-aiv-muted">
        <span>
          Cara asks <span className="text-aiv-text">“Why is checkout failing with ERR-4071?”</span> with the federated tier split.
        </span>
        <label className="flex items-center gap-2">
          Budget
          <input type="range" min={150} max={500} step={10} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="accent-[#ff3366]" />
          <span className="font-mono text-aiv-text">{budget}</span>
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ContextColumn label="Before consolidation" blocks={before.blocks} words={before.fullWords} budget={budget} highlight={hl} />
        <ContextColumn label="After consolidation" blocks={after.blocks} words={after.fullWords} budget={budget} highlight={hl} />
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] text-aiv-faint">
        <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#dc3545]" />card-issuer hypothesis (wrong)</span>
        <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#ffc107]" />engineering root-cause fact</span>
        <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#28a745]" />org-level insight</span>
      </div>
      <div className={cx('rounded-lg border px-4 py-2.5 text-sm', insightIn ? 'border-aiv-ok/30 bg-aiv-ok/10 text-aiv-muted' : 'border-aiv-warn/30 bg-aiv-warn/10 text-amber-100/80')}>
        {insightIn
          ? 'Before consolidation, the context offers two competing explanations and leaves the model to choose. After, the organisation-level insight and engineering’s pattern spell out what happened, what customers are owed, and what changed. The card-issuer hypothesis is still retrieved: applying the conflict resolution from act 5 (supersede) is what would retire it.'
          : `At ${budget} words, the org tier gets ${Math.floor(budget * 0.15)} words, and the insight needs ${cost(get('org-1'))}. Same knowledge, different budget: raise it to see the insight return.`}
      </div>
      <Button size="sm" variant="secondary" onClick={() => onJump({ view: 'inspector', agentId: 'cara', preset: { query: base.query, budget, presetId: 'federated' } })}>
        Open this in the assembly inspector →
      </Button>
    </div>
  )
}

interface Act {
  title: string
  lead: string
  body: (onJump: (j: Jump) => void) => ReactNode
}

const ACTS: Act[] = [
  {
    title: 'Five agents, twenty-four observations',
    lead: 'On October 6, checkout starts failing with ERR-4071. Three support agents field tickets; two engineering agents investigate. Each writes memories as it works: episodes, facts and procedures, stamped with its own identity and a visibility level.',
    body: (onJump) => (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {AGENTS.map((a, ai) => (
            <div key={a.id} className="min-w-0">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: TEAMS[a.team_id].color }} />
                <span className="font-semibold">{a.name}</span>
                <span className="text-aiv-faint">· {TEAMS[a.team_id].label}</span>
              </div>
              <div className="space-y-1.5">
                {RAW.filter((m) => m.agent_id === a.id).map((m, i) => (
                  <Mini key={m.id} m={m} delay={ai * 120 + i * 60} highlight={m.id === 'ben-04' ? '#dc3545' : m.id === 'eli-04' ? '#ffc107' : undefined} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-aiv-muted">
          Notice the outlined pair: Ben records that ERR-4071 is <span className="text-red-300">a card issuer declining payments</span>, while Eli
          records that it is <span className="text-amber-300">a 2-second gateway timeout shipped in v2.1</span>. Nothing yet connects them.
        </p>
        <Button size="sm" variant="secondary" onClick={() => onJump({ view: 'memories', agentId: 'ava' })}>
          See who can read what in the memory store →
        </Button>
      </div>
    ),
  },
  {
    title: 'Agent-level consolidation',
    lead: 'Each agent consolidates its own memories first. The deduplication specialist finds that Ava wrote the same Mastercard failure twice, once as a draft before tickets were merged, and folds them into one memory that remembers both sources.',
    body: () => (
      <Derivation
        derived={get('ava-c1')}
        note={
          <Report
            title="ConsolidationReport"
            rows={[
              ['level', 'AGENT'],
              ['identity', 'ava'],
              ['specialist', 'deduplication'],
              ['source_memory_count', 2],
              ['derived_memory_count', 1],
              ['visibility', 'PRIVATE'],
            ]}
          />
        }
      />
    ),
  },
  {
    title: 'Team consolidation surfaces patterns',
    lead: "Consolidating across a whole team finds what no single agent could: Ava, Ben and Cara each saw a few failures, but together they show every card brand failing from 14:00 on Oct 6, and banks seeing no authorization attempts at all. Team-level memories are written under a system identity, not any one agent's.",
    body: () => (
      <div className="space-y-5">
        <Derivation
          derived={get('team-sup-1')}
          note={
            <Report
              title="ConsolidationReport · support"
              rows={[
                ['level', 'TEAM'],
                ['identity', 'system:team:support'],
                ['specialist', 'pattern'],
                ['source_memory_count', 6],
                ['visibility', 'TEAM'],
              ]}
            />
          }
        />
        <Derivation
          derived={get('team-eng-1')}
          note={<Report title="ConsolidationReport · engineering" rows={[['level', 'TEAM'], ['identity', 'system:team:engineering'], ['source_memory_count', 6], ['visibility', 'CROSS_TEAM (shared)']]} color="border-amber-400/40" />}
        />
      </div>
    ),
  },
  {
    title: 'Federation: support publishes, engineering subscribes',
    lead: "Team memories stay inside the team. To share across teams, support publishes a memory type under a schema contract; governance checks the contract; engineering discovers the publication and subscribes. Now Eli's cross-team searches can reach what support learned about customer impact. Engineering shares its own pattern cross-team the same way, which is what makes both eligible for org-level consolidation.",
    body: (onJump) => (
      <div className="space-y-4">
        <Derivation derived={get('team-sup-3')} />
        <div className="grid gap-3 md:grid-cols-3">
          <Report
            title="1 · publish()"
            color="border-sky-400/40"
            rows={[
              ['type', 'episodic'],
              ['publishing_team', 'support'],
              ['schema_version', '1.0'],
              ['required_fields', 'summary, t_obs'],
              ['tags', 'impact, incident'],
            ]}
          />
          <Report title="2 · governance" color="border-aiv-ok/40" rows={[['contract check', 'PASS'], ['quota (support)', '30 / 10,000'], ['access policy', 'org: acme']]} />
          <Report title="3 · discover() → subscribe()" color="border-amber-400/40" rows={[['consumer', 'engineering'], ['query', '"impact"'], ['found', '1 publication'], ['subscribed_at', 'Oct 9, 04:10']]} />
        </div>
        <Button size="sm" variant="secondary" onClick={() => onJump({ view: 'inspector', agentId: 'eli', preset: { query: 'customer impact of the incident', budget: 300, presetId: 'federated' } })}>
          Run a cross-team assembly as Eli →
        </Button>
      </div>
    ),
  },
  {
    title: 'Organization-level consolidation',
    lead: "With both teams' findings visible across the org, consolidation at the organisation level writes a single insight: what failed, why, what customers are owed and what changes. Along the way the conflict detector flags the two incompatible explanations of ERR-4071.",
    body: () => (
      <div className="space-y-4">
        <Derivation derived={get('org-1')} />
        <div className="animate-fade-up rounded-lg border border-aiv-warn/40 bg-aiv-warn/5 p-4" style={{ animationDelay: '500ms' }}>
          <div className="mb-2 text-sm font-semibold text-amber-200">Conflict detected</div>
          <div className="grid gap-2 md:grid-cols-2">
            <Mini m={get('ben-04')} highlight="#dc3545" />
            <Mini m={get('eli-04')} highlight="#ffc107" />
          </div>
          <div className="mt-3 grid gap-x-6 gap-y-1 font-mono text-[11px] sm:grid-cols-3">
            <span>
              <span className="text-aiv-faint">type </span>logical_contradiction
            </span>
            <span>
              <span className="text-aiv-faint">scope </span>cross_team
            </span>
            <span>
              <span className="text-aiv-faint">suggested </span>supersede → eli-04
            </span>
          </div>
          <p className="mt-2 text-xs text-aiv-muted">Engineering's fact is newer and backed by a config diff and a rollback that fixed the errors; support's was a hypothesis from the first hours.</p>
        </div>
      </div>
    ),
  },
  {
    title: 'Lineage: tracing the insight back',
    lead: 'Every derived memory records where it came from. Follow the insight down through the published summary and both team patterns to the raw tickets and alerts. Viewed as a support agent, engineering sources stay attributed but their contents are withheld.',
    body: (onJump) => (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-aiv-line px-2.5 py-1 text-aiv-muted">{countLeaves(get('org-1'))} raw observations</span>
          <span className="rounded-full border border-aiv-line px-2.5 py-1 text-aiv-muted">2 teams · 5 agents</span>
          <span className="rounded-full border border-aiv-line px-2.5 py-1 text-aiv-muted">
            {MEMORIES.filter((m) => hiddenReason(m, 'ava')).length} memories hidden from Ava
          </span>
        </div>
        <ul className="max-h-[520px] overflow-y-auto pr-1">
          <LineageNode m={get('org-1')} agentId="ava" depth={0} />
        </ul>
        <Button size="sm" variant="secondary" onClick={() => onJump({ view: 'lineage', agentId: 'eli', root: 'org-1' })}>
          Explore lineage as Eli instead →
        </Button>
      </div>
    ),
  },
  {
    title: 'The payoff: what an agent sees now',
    lead: 'A week later, Cara asks why checkout failed. Same agent, same query, same token budget. Compare the context Memento assembles from the raw memories alone with the context after consolidation.',
    body: (onJump) => <Payoff onJump={onJump} />,
  },
]

export default function Tour({ onJump, act, setAct }: { onJump: (j: Jump) => void; act: number; setAct: (fn: (a: number) => number) => void }) {
  const a = ACTS[act]
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA|SELECT/)) return
      if (e.key === 'ArrowRight') setAct((x) => Math.min(ACTS.length - 1, x + 1))
      if (e.key === 'ArrowLeft') setAct((x) => Math.max(0, x - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setAct])

  return (
    <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)] [&>*]:min-w-0">
      <nav aria-label="Acts" className="flex gap-1 overflow-x-auto pb-1 lg:sticky lg:top-20 lg:flex-col lg:self-start lg:overflow-visible">
        <div className="mb-1 hidden text-[11px] font-semibold tracking-wider text-aiv-faint uppercase lg:block">From incident to insight</div>
        {ACTS.map((x, i) => (
          <button
            key={x.title}
            onClick={() => setAct(() => i)}
            className={cx(
              'flex shrink-0 items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition lg:w-full',
              i === act ? 'bg-aiv-accent/12 text-aiv-text' : 'text-aiv-muted hover:bg-aiv-raised hover:text-aiv-text',
            )}
          >
            <span className={cx('grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold', i === act ? 'border-aiv-accent bg-aiv-accent text-white' : i < act ? 'border-aiv-accent/60 text-aiv-accent-soft' : 'border-aiv-line-strong')}>
              {i + 1}
            </span>
            <span className="hidden leading-snug lg:inline">{x.title}</span>
          </button>
        ))}
      </nav>

      <div key={act}>
        <div className="text-[11px] font-semibold tracking-wider text-aiv-accent-soft uppercase">
          Act {act + 1} of {ACTS.length}
        </div>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-wide">{a.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-aiv-muted">{a.lead}</p>
        <Card className="mt-5 p-4 sm:p-5">{a.body(onJump)}</Card>
        <div className="mt-5 flex items-center justify-between">
          <Button variant="secondary" size="sm" disabled={act === 0} onClick={() => setAct((x) => x - 1)}>
            <ChevronLeft size={14} /> Previous
          </Button>
          <span className="hidden text-xs text-aiv-faint sm:inline">← → keys also work</span>
          {act < ACTS.length - 1 ? (
            <Button size="sm" onClick={() => setAct((x) => x + 1)}>
              Next: {ACTS[act + 1].title} <ChevronRight size={14} />
            </Button>
          ) : (
            <Button size="sm" onClick={() => onJump({ view: 'inspector', agentId: 'ava', preset: {} })}>
              Explore the inspector <ChevronRight size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
