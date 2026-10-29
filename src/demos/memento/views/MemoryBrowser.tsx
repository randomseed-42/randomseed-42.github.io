import { useState } from 'react'
import { Lock } from 'lucide-react'
import { MEMORIES, TEAMS, type Memory, type MemType } from '../data/memories'
import { SCOPES, cost, hiddenReason, relation, title, viewer, type Scope } from '../lib/engine'
import { Card, cx } from '../../shared/ui'
import { TypeBadge, VisBadge } from './Inspector'

const GROUPS: { scope: Scope; label: string; rule: string }[] = [
  { scope: 'AGENT', label: 'Own memories', rule: 'Ownership: an agent can always read what it wrote.' },
  { scope: 'TEAM', label: 'Team-visible', rule: 'Visibility ≥ TEAM and same team_id, including team consolidations.' },
  { scope: 'CROSS_TEAM', label: 'Cross-team', rule: 'Visibility CROSS_TEAM from another team in the same organisation.' },
  { scope: 'ORGANIZATION', label: 'Organisation', rule: 'Visibility ORGANIZATION or PUBLIC: org-level consolidations.' },
]

function fmtDate(iso?: string) {
  return iso ? new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : 'no t_obs'
}

function MemoryCard({ m, locked, reason }: { m: Memory; locked?: boolean; reason?: string }) {
  return (
    <div className={cx('rounded-lg border p-3', locked ? 'border-dashed border-aiv-line bg-transparent' : 'border-aiv-line bg-aiv-panel')}>
      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="h-2 w-2 rounded-full" style={{ background: TEAMS[m.team_id].color }} />
        <span className="font-mono text-aiv-muted">{m.agent_id}</span>
        <TypeBadge m={m} />
        <VisBadge v={m.visibility} />
        {m.consolidation_level && <span className="rounded border border-aiv-accent/40 px-1 text-aiv-accent-soft">{m.consolidation_level} · {m.specialist}</span>}
        <span className="ml-auto text-aiv-faint">{fmtDate(m.t_obs)}</span>
      </div>
      {locked ? (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-aiv-faint">
          <Lock size={12} /> {reason}
        </div>
      ) : (
        <>
          <div className="mt-1.5 text-sm">{title(m)}</div>
          {m.type === 'episodic' && <div className="mt-1 text-xs leading-relaxed text-aiv-muted">{m.details}</div>}
          <div className="mt-2 flex flex-wrap gap-x-3 text-[10px] text-aiv-faint">
            <span>{cost(m)} words</span>
            <span>source: {m.source_pipeline}</span>
            {m.times_derived > 0 && <span>cited by {m.times_derived} derived memor{m.times_derived > 1 ? 'ies' : 'y'}</span>}
            {m.source_ids && <span>derived from {m.source_ids.length}</span>}
            {m.tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function MemoryBrowser({ agentId }: { agentId: string }) {
  const [scope, setScope] = useState<Scope>('ALL_VISIBLE')
  const [types, setTypes] = useState<MemType[]>(['episodic', 'semantic', 'procedural'])
  const [showHidden, setShowHidden] = useState(true)
  const v = viewer(agentId)
  const visible = MEMORIES.filter((m) => !hiddenReason(m, agentId) && types.includes(m.type))
  const hidden = MEMORIES.filter((m) => hiddenReason(m, agentId) && types.includes(m.type))
  const counts = SCOPES.map((s) => visible.filter((m) => SCOPES.indexOf(relation(m, agentId)) <= SCOPES.indexOf(s)).length)

  return (
    <div className="space-y-4">
      <p className="max-w-4xl text-sm text-aiv-muted">
        <span className="text-aiv-text">Who can see what?</span> Every memory carries the agent, team and organisation that wrote it, plus a
        visibility level. Pick an agent above and a retrieval scope to see exactly what that agent can read, and which rule let each memory
        through. {MEMORIES.length} memories in the store; {visible.length + hidden.length === MEMORIES.length ? '' : 'filtered by type; '}
        {v.name} can see {visible.length}.
      </p>

      <Card className="p-4">
        <div className="text-xs text-aiv-muted">Retrieval scope (cumulative)</div>
        <div className="mt-2 grid gap-1 sm:grid-cols-5">
          {SCOPES.map((s, i) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={cx('rounded-lg border px-3 py-2 text-left transition', SCOPES.indexOf(scope) >= i ? 'border-aiv-accent/50 bg-aiv-accent/10' : 'border-aiv-line')}
            >
              <div className="font-mono text-[11px]">{s}</div>
              <div className="font-display text-xl font-semibold">{counts[i]}</div>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          {(['episodic', 'semantic', 'procedural'] as MemType[]).map((t) => (
            <label key={t} className="flex items-center gap-1.5 text-aiv-muted">
              <input type="checkbox" className="accent-[#ff3366]" checked={types.includes(t)} onChange={() => setTypes((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} />
              {t}
            </label>
          ))}
          <label className="ml-auto flex items-center gap-1.5 text-aiv-muted">
            <input type="checkbox" className="accent-[#ff3366]" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
            show what {v.name} can't see
          </label>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4 [&>*]:min-w-0">
        {GROUPS.map((g) => {
          const items = visible.filter((m) => relation(m, agentId) === g.scope)
          const active = SCOPES.indexOf(g.scope) <= SCOPES.indexOf(scope)
          return (
            <div key={g.scope} className={cx('transition-opacity', !active && 'opacity-35')}>
              <div className="mb-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-lg font-semibold">{g.label}</h3>
                  <span className="text-xs text-aiv-faint">{items.length}</span>
                </div>
                <p className="text-[11px] text-aiv-faint">{g.rule}</p>
                {!active && <p className="text-[11px] text-amber-300/80">Outside the {scope} scope</p>}
              </div>
              <div className="space-y-2">
                {items.map((m) => (
                  <MemoryCard key={m.id} m={m} />
                ))}
                {!items.length && <p className="text-xs text-aiv-faint">None.</p>}
              </div>
            </div>
          )
        })}
      </div>

      {showHidden && hidden.length > 0 && (
        <div>
          <h3 className="mb-2 font-display text-lg font-semibold">
            Not visible to {v.name} <span className="text-sm font-normal text-aiv-faint">({hidden.length})</span>
          </h3>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {hidden.map((m) => (
              <MemoryCard key={m.id} m={m} locked reason={hiddenReason(m, agentId)!} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
