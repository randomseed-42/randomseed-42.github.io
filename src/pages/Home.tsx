import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import GitHubActivity from '../components/GitHubActivity'
import { projects, site, type Project } from '../site'

const BADGE = {
  demo: { label: 'Interactive demo', cls: 'bg-emerald-500/15 text-emerald-300', cta: 'Open demo' },
  tour: { label: 'Screenshot tour', cls: 'bg-sky-500/15 text-sky-300', cta: 'View tour' },
}

function ProjectCard({ p }: { p: Project }) {
  const badge = BADGE[p.format]
  const body = (
    <>
      <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-lg border border-ink-800 bg-ink-950 p-2">
        <img
          src={`${import.meta.env.BASE_URL}shots/${p.cover}`}
          alt={`${p.name} screenshot`}
          loading="lazy"
          className="max-h-full max-w-full rounded object-contain transition group-hover:scale-[1.02]"
        />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-ink-100">{p.name}</h3>
        {p.status === 'live' ? (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
        ) : (
          <span className="rounded-full bg-ink-800 px-2 py-0.5 text-xs font-medium text-ink-400">Coming soon</span>
        )}
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-300">{p.summary}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {p.tags.map((t) => (
          <span key={t} className="rounded bg-ink-800 px-2 py-0.5 text-xs text-ink-300">
            {t}
          </span>
        ))}
      </div>
      {p.status === 'live' && (
        <span className="mt-4 flex items-center gap-1 text-sm font-medium text-accent-400 group-hover:gap-2 transition-all">
          {badge.cta} <ArrowRight size={14} />
        </span>
      )}
    </>
  )
  const cls = 'group flex flex-col rounded-xl border border-ink-800 bg-ink-900 p-5'
  return p.status === 'live' ? (
    <Link to={`/projects/${p.slug}`} className={`${cls} transition hover:border-accent-600/60 hover:bg-ink-850`}>
      {body}
    </Link>
  ) : (
    <div className={`${cls} opacity-80`}>{body}</div>
  )
}

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <header className="flex items-center justify-between py-6">
        <span className="font-mono text-sm text-ink-400">{site.handle}</span>
        <nav className="flex items-center gap-4 text-sm text-ink-300">
          <a href="#projects" className="hover:text-ink-100">Projects</a>
          <a href="#activity" className="hover:text-ink-100">Activity</a>
          <a href={`https://github.com/${site.handle}`} className="hover:text-ink-100" aria-label="GitHub">
            <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        </nav>
      </header>

      <section className="py-14 sm:py-20">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{site.name}</h1>
        <p className="mt-4 text-xl text-ink-200 sm:text-2xl">{site.tagline}</p>
        <p className="mt-6 max-w-2xl leading-relaxed text-ink-400">{site.intro}</p>
      </section>

      <section id="projects" className="scroll-mt-6 pb-16">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">Projects</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.slug} p={p} />
          ))}
        </div>
      </section>

      <section id="activity" className="scroll-mt-6 pb-20">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">Public Repository Activity</h2>
        <GitHubActivity />
      </section>

      <footer className="border-t border-ink-800 py-8 text-xs text-ink-400">
        Demos and screenshots use synthetic data; the interactive demos run entirely client-side. Built with React, Vite and Tailwind.
      </footer>
    </div>
  )
}
