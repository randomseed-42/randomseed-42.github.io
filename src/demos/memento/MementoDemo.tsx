import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AGENTS, TEAMS } from './data/memories'
import { Tabs, cx } from '../shared/ui'
import Inspector from './views/Inspector'
import MemoryBrowser from './views/MemoryBrowser'
import Lineage from './views/Lineage'
import Tour, { type Jump } from './views/Tour'
import type { InspectorPreset } from './views/Inspector'

type View = 'tour' | 'inspector' | 'memories' | 'lineage'

export function AgentPicker({ agentId, onChange }: { agentId: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs text-aiv-faint">View as</span>
      {AGENTS.map((a) => (
        <button
          key={a.id}
          onClick={() => onChange(a.id)}
          title={a.role}
          className={cx(
            'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition',
            a.id === agentId ? 'border-aiv-text/60 bg-aiv-raised text-aiv-text' : 'border-aiv-line text-aiv-muted hover:text-aiv-text',
          )}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: TEAMS[a.team_id].color }} />
          {a.name}
          <span className="text-aiv-faint">· {TEAMS[a.team_id].label}</span>
        </button>
      ))}
    </div>
  )
}

export default function MementoDemo() {
  const [view, setView] = useState<View>('tour')
  const [act, setAct] = useState(0)
  const [agentId, setAgentId] = useState('ava')
  const [preset, setPreset] = useState<InspectorPreset | undefined>()
  const [lineageRoot, setLineageRoot] = useState<string | undefined>()
  // Bumped on every jump so the target view remounts with its new starting state.
  const [jumpKey, setJumpKey] = useState(0)
  const jump = (j: Jump) => {
    setAgentId(j.agentId)
    if (j.view === 'inspector') setPreset(j.preset)
    if (j.view === 'lineage') setLineageRoot(j.root)
    setJumpKey((k) => k + 1)
    setView(j.view)
    window.scrollTo(0, 0)
  }
  // Scroll to the top when the act changes, without returning scrollTo's value from the effect.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [act])
  return (
    <div className="min-h-screen bg-aiv-bg text-aiv-text">
      <div className="border-b border-aiv-warn/20 bg-aiv-warn/5 px-4 py-1.5 text-center text-xs text-amber-200/80">
        Interactive mock-up · synthetic memories · the pipeline runs in your browser
      </div>
      <header className="sticky top-0 z-30 border-b border-aiv-line bg-aiv-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-1 text-xs text-aiv-muted hover:text-aiv-text">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Portfolio</span>
          </Link>
          <span className="h-5 w-px bg-aiv-line-strong" />
          <span className="font-display text-xl font-bold tracking-wide">
            Mem<span className="text-aiv-accent">ento</span>
          </span>
          <span className="hidden text-sm text-aiv-muted md:inline">· agent memory inspector</span>
        </div>
      </header>
      <div className="mx-auto max-w-[1500px] px-4 pt-4 pb-24 sm:px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Tabs<View>
              tabs={[
                { id: 'tour', label: 'Guided tour' },
                { id: 'inspector', label: 'Context assembly' },
                { id: 'memories', label: 'Memory store' },
                { id: 'lineage', label: 'Lineage' },
              ]}
              active={view}
              onChange={setView}
            />
          </div>
        </div>
        {view !== 'tour' && (
          <div className="mb-5 rounded-lg border border-aiv-line bg-aiv-surface px-4 py-2.5">
            <AgentPicker agentId={agentId} onChange={setAgentId} />
          </div>
        )}
        {view === 'tour' && <Tour onJump={jump} act={act} setAct={setAct} />}
        {view === 'inspector' && <Inspector key={jumpKey} agentId={agentId} initial={preset} />}
        {view === 'memories' && <MemoryBrowser agentId={agentId} />}
        {view === 'lineage' && <Lineage key={jumpKey} agentId={agentId} initialRoot={lineageRoot} />}
      </div>
    </div>
  )
}
