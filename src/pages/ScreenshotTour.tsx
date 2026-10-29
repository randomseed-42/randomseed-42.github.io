import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { cx } from '../demos/shared/ui'
import type { Tour } from '../tours'

export default function ScreenshotTour({ tour }: { tour: Tour }) {
  const [params, setParams] = useSearchParams()
  const n = tour.shots.length
  const raw = Number(params.get('step'))
  const i = Number.isInteger(raw) && raw >= 1 && raw <= n ? raw - 1 : 0
  const go = (k: number) => setParams(k === 0 ? {} : { step: String(k + 1) }, { replace: true })
  const shot = tour.shots[i]
  const active = useRef<HTMLButtonElement>(null)

  // On narrow screens the step list scrolls sideways; keep the current step in view.
  useEffect(() => {
    active.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [i])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return
      if (e.key === 'ArrowRight' && i < n - 1) go(i + 1)
      if (e.key === 'ArrowLeft' && i > 0) go(i - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="min-h-screen bg-aiv-bg text-aiv-text">
      <div className="border-b border-aiv-warn/20 bg-aiv-warn/5 px-4 py-1.5 text-center text-xs text-amber-200/80">Screenshot tour · synthetic data</div>
      <header className="border-b border-aiv-line">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-1 text-xs text-aiv-muted hover:text-aiv-text">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Portfolio</span>
          </Link>
          <span className="h-5 w-px bg-aiv-line-strong" />
          <span className="font-display text-xl font-bold tracking-wide">{tour.name}</span>
          <span className="hidden text-sm text-aiv-muted sm:inline">· {tour.subtitle}</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-6 pb-24 sm:px-6">
        <p className="max-w-3xl text-sm leading-relaxed text-aiv-muted">{tour.intro}</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="Tour steps" className="flex min-w-0 gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:self-start lg:overflow-visible">
            {tour.shots.map((s, k) => (
              <button
                key={s.src}
                ref={k === i ? active : undefined}
                onClick={() => go(k)}
                aria-current={k === i ? 'step' : undefined}
                className={cx(
                  'flex shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition lg:w-full',
                  k === i ? 'bg-aiv-accent/12 text-aiv-text' : 'text-aiv-muted hover:bg-aiv-raised hover:text-aiv-text',
                )}
              >
                <span
                  className={cx(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-bold',
                    k === i ? 'border-aiv-accent bg-aiv-accent text-white' : 'border-aiv-line-strong',
                  )}
                >
                  {k + 1}
                </span>
                <span className="whitespace-nowrap lg:whitespace-normal">{s.title}</span>
              </button>
            ))}
          </nav>

          <main className="min-w-0">
            <div className="text-[11px] font-semibold tracking-wider text-aiv-accent-soft uppercase">
              Step {i + 1} of {n}
            </div>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-wide">{shot.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-aiv-muted">{shot.caption}</p>

            <figure className="group relative mt-5 flex justify-center rounded-xl border border-aiv-line bg-aiv-surface p-3 sm:p-5">
              <a href={shot.src} target="_blank" rel="noreferrer" title="Open full size" className="block">
                <img
                  src={shot.src}
                  width={shot.width}
                  height={shot.height}
                  alt={shot.alt}
                  className="h-auto max-h-[75vh] w-auto max-w-full rounded-md border border-aiv-line object-contain"
                />
              </a>
              <Maximize2 size={14} className="pointer-events-none absolute top-3 right-3 text-aiv-faint opacity-0 transition group-hover:opacity-100" />
            </figure>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                onClick={() => go(i - 1)}
                disabled={i === 0}
                className="flex items-center gap-1 rounded-md border border-aiv-line-strong px-3 py-1.5 text-sm text-aiv-muted hover:text-aiv-text disabled:opacity-40"
              >
                <ChevronLeft size={15} /> Previous
              </button>
              <span className="hidden text-xs text-aiv-faint sm:inline">← → keys also work</span>
              {i < n - 1 ? (
                <button onClick={() => go(i + 1)} className="flex items-center gap-1 rounded-md bg-aiv-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-aiv-accent-hover">
                  <span className="hidden sm:inline">Next: {tour.shots[i + 1].title}</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight size={15} />
                </button>
              ) : (
                <Link to="/" className="flex items-center gap-1 rounded-md bg-aiv-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-aiv-accent-hover">
                  Back to the portfolio
                </Link>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
