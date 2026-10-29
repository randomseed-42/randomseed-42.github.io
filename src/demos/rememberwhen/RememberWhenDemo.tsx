import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { RWProvider, useRW, type Tab } from './store'
import { VIEWERS, seesCareConsole } from './lib/access'
import { GROWTH } from './lib/growth'
import { RESIDENT, TOTAL_WEEKS } from './data/resident'
import { SESSIONS } from './data/sessions'
import { cx } from '../shared/ui'
import TheCall from './views/TheCall'
import MemoryGraph from './views/MemoryGraph'
import Biosketch from './views/Biosketch'
import CareConsole from './views/CareConsole'

function Nav() {
  const { tab, setTab, viewer } = useRW()
  const tabs: { id: Tab; label: string }[] = [
    { id: 'call', label: 'The call' },
    { id: 'graph', label: 'Memory graph' },
    { id: 'biosketch', label: 'Biosketch' },
    ...(seesCareConsole(viewer) ? [{ id: 'console' as Tab, label: 'Care console' }] : []),
  ]
  return (
    <header className="bg-rw-nav">
      <div className="mx-auto flex min-h-[74px] max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-1 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-1 text-xs text-rw-nav-muted hover:text-white" title="Back to portfolio">
          <ArrowLeft size={14} />
        </Link>
        <div className="text-lg whitespace-nowrap text-white sm:text-xl">
          <span className="font-extrabold">Remember When</span>
          <span className="font-medium text-rw-nav-muted"> · Care Intelligence</span>
        </div>
        <nav className="flex h-[74px] items-stretch gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cx(
                'border-b-[3px] px-3 text-[15px] whitespace-nowrap transition',
                tab === t.id ? 'border-rw-nav-active font-bold text-white' : 'border-transparent text-rw-nav-text hover:text-white',
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <span className="ml-auto hidden rounded-lg border border-rw-nav-line px-3 py-1.5 text-xs text-rw-nav-text lg:inline">Simulated resident data — illustrative</span>
      </div>
    </header>
  )
}

/** Demo-only controls: who is looking, and what the resident has agreed to share. */
function ViewerBar() {
  const { viewer, setViewer, consent, setConsent } = useRW()
  return (
    <div className="border-b border-amber-300/60 bg-amber-50">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 text-sm sm:px-6">
        <span className="text-xs font-semibold tracking-wide text-amber-900 uppercase">Demo · viewing as</span>
        <div className="flex flex-wrap gap-1">
          {VIEWERS.map((v) => (
            <button
              key={v.kind}
              onClick={() => setViewer(v.kind)}
              title={v.blurb}
              className={cx('rounded-full border px-3 py-1 text-xs font-medium transition', viewer === v.kind ? 'border-rw-nav bg-rw-nav text-white' : 'border-amber-300 bg-white text-amber-900 hover:border-amber-500')}
            >
              {v.label}
            </button>
          ))}
        </div>
        <span className="hidden h-5 w-px bg-amber-300 md:block" />
        <span className="text-xs text-amber-900">{RESIDENT.first_name} shares her conversations with</span>
        <label className="flex items-center gap-1.5 text-xs text-amber-900">
          <input type="checkbox" checked={consent.staff} onChange={(e) => setConsent({ ...consent, staff: e.target.checked })} className="accent-[#132339]" />
          the care team
        </label>
        <label className="flex items-center gap-1.5 text-xs text-amber-900">
          <input type="checkbox" checked={consent.family} onChange={(e) => setConsent({ ...consent, family: e.target.checked })} className="accent-[#132339]" />
          family
        </label>
      </div>
    </div>
  )
}

function WeekStrip() {
  const { week, setWeek } = useRW()
  const g = GROWTH[week - 1]
  const quiet = GROWTH.filter((x) => x.added === 0).length
  const delta =
    g.added_prior === null ? 'first week' : g.added_prior === 0 ? 'nothing added the week before' : `${g.added >= g.added_prior ? '+' : ''}${Math.round(((g.added - g.added_prior) / g.added_prior) * 100)}% vs the week before`
  const session = [...SESSIONS].reverse().find((s) => s.week <= week)
  return (
    <div className="border-b border-rw-line bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 sm:px-6">
        <span className="text-sm font-medium text-rw-ink">Week</span>
        <input type="range" min={1} max={TOTAL_WEEKS} value={week} onChange={(e) => setWeek(Number(e.target.value))} className="min-w-40 flex-1 accent-[#1e63b4]" aria-label="Week" />
        <span className="text-sm text-rw-muted" title="people, events, places and organizations in the memory graph">
          Week <b className="text-rw-ink">{week}</b> · {g.label}
          {session && ` · session ${session.number}`} · <b className="text-rw-ink">{g.cumulative}</b> memories · {g.added ? `${g.added} new` : 'nothing new'} · {delta}
        </span>
        {quiet > 0 && <span className="text-xs text-rw-faint">{quiet} of {TOTAL_WEEKS} weeks added nothing new.</span>}
      </div>
    </div>
  )
}

function Body() {
  const { tab } = useRW()
  return (
    <div className="min-h-screen bg-rw-ground font-rw text-rw-ink [color-scheme:light]">
      <Nav />
      <ViewerBar />
      {tab !== 'console' && <WeekStrip />}
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        {tab === 'call' && <TheCall />}
        {tab === 'graph' && <MemoryGraph />}
        {tab === 'biosketch' && <Biosketch />}
        {tab === 'console' && <CareConsole />}
      </main>
    </div>
  )
}

export default function RememberWhenDemo() {
  const featured = [...SESSIONS].reverse().find((s) => s.replayable)!
  return (
    <RWProvider initialCall={featured.call_id}>
      <Body />
    </RWProvider>
  )
}
