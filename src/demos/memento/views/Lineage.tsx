import { useState } from 'react'
import { Lock } from 'lucide-react'
import { MEMORIES, TEAMS, type Memory } from '../data/memories'
import { hiddenReason, title } from '../lib/engine'
import { Card, cx } from '../../shared/ui'
import { TypeBadge, VisBadge } from './Inspector'

const byId = new Map(MEMORIES.map((m) => [m.id, m]))
const DERIVED = MEMORIES.filter((m) => m.source_ids?.length).sort((a, b) => order(b) - order(a))

function order(m: Memory) {
  return ['AGENT', 'TEAM', 'CROSS_TEAM', 'ORGANIZATION'].indexOf(m.consolidation_level ?? '')
}

export function countLeaves(m: Memory): number {
  return m.source_ids ? m.source_ids.reduce((a, id) => a + countLeaves(byId.get(id)!), 0) : 1
}

export function LineageNode({ m, agentId, depth }: { m: Memory; agentId: string; depth: number }) {
  const [open, setOpen] = useState(depth < 2)
  const hidden = hiddenReason(m, agentId)
  const kids = m.source_ids?.map((id) => byId.get(id)!) ?? []
  return (
    <li className="relative">
      <div className={cx('rounded-lg border p-2.5', hidden ? 'border-dashed border-aiv-line-strong' : 'border-aiv-line bg-aiv-panel')} style={{ borderLeft: `4px solid ${TEAMS[m.team_id].color}` }}>
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="font-mono text-aiv-muted">{m.agent_id}</span>
          <TypeBadge m={m} />
          <VisBadge v={m.visibility} />
          {m.consolidation_level ? (
            <span className="rounded border border-aiv-accent/40 px-1 text-aiv-accent-soft">
              {m.consolidation_level} · {m.specialist}
            </span>
          ) : (
            <span className="text-aiv-faint">raw observation</span>
          )}
          {hidden && (
            <span className="flex items-center gap-1 text-amber-300/80">
              <Lock size={10} /> {hidden}
            </span>
          )}
          {kids.length > 0 && (
            <button onClick={() => setOpen((o) => !o)} className="ml-auto text-aiv-accent-soft hover:underline">
              {open ? 'collapse' : `${kids.length} source${kids.length > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
        {hidden ? (
          <div className="mt-1 text-sm text-aiv-faint italic">Content withheld from {agentId}: lineage keeps the source's identity, not its text</div>
        ) : (
          <div className="mt-1 text-sm">{title(m)}</div>
        )}
      </div>
      {open && kids.length > 0 && (
        <ul className="mt-2 ml-4 space-y-2 border-l border-aiv-line-strong pl-4">
          {kids.map((k) => (
            <LineageNode key={k.id} m={k} agentId={agentId} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function Lineage({ agentId, initialRoot }: { agentId: string; initialRoot?: string }) {
  const [rootId, setRootId] = useState(initialRoot ?? DERIVED[0].id)
  const root = byId.get(rootId)!
  const leaves = countLeaves(root)
  const teams = new Set<string>()
  const walk = (m: Memory) => {
    if (!m.agent_id.startsWith('system:')) teams.add(m.team_id)
    m.source_ids?.forEach((id) => walk(byId.get(id)!))
  }
  walk(root)
  return (
    <div className="space-y-4">
      <p className="max-w-4xl text-sm text-aiv-muted">
        <span className="text-aiv-text">Where did this knowledge come from?</span> Consolidation turns raw observations into agent, team and
        organisation-level memories, and every derived memory records its sources. Trace any of them back to the tickets and alerts it was
        built from. Lineage keeps team attribution even where the current viewer can't read the source itself.
      </p>
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] [&>*]:min-w-0">
        <Card className="p-3">
          <div className="mb-2 px-1 text-xs text-aiv-faint">Derived memories</div>
          <div className="space-y-1">
            {DERIVED.map((m) => (
              <button
                key={m.id}
                onClick={() => setRootId(m.id)}
                className={cx('block w-full rounded-lg border px-3 py-2 text-left transition', m.id === rootId ? 'border-aiv-accent/60 bg-aiv-raised' : 'border-aiv-line hover:border-aiv-line-strong')}
              >
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="h-2 w-2 rounded-full" style={{ background: TEAMS[m.team_id].color }} />
                  <span className="font-mono text-aiv-accent-soft">{m.consolidation_level}</span>
                  <span className="text-aiv-faint">· {m.specialist}</span>
                  {hiddenReason(m, agentId) && <Lock size={10} className="ml-auto text-amber-300/80" />}
                </div>
                <div className="mt-0.5 line-clamp-2 text-xs text-aiv-muted">{hiddenReason(m, agentId) ? <span className="italic text-aiv-faint">Not visible to {agentId}</span> : title(m)}</div>
              </button>
            ))}
          </div>
        </Card>
        <div>
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-aiv-line px-2.5 py-1 text-aiv-muted">{leaves} raw observations</span>
            <span className="rounded-full border border-aiv-line px-2.5 py-1 text-aiv-muted">
              {teams.size} team{teams.size > 1 ? 's' : ''}: {[...teams].map((t) => TEAMS[t].label).join(', ')}
            </span>
            {[...teams].map((t) => (
              <span key={t} className="flex items-center gap-1 text-aiv-faint">
                <span className="h-2 w-2 rounded-full" style={{ background: TEAMS[t].color }} /> {TEAMS[t].label}
              </span>
            ))}
          </div>
          <ul>
            <LineageNode key={rootId} m={root} agentId={agentId} depth={0} />
          </ul>
        </div>
      </div>
    </div>
  )
}
