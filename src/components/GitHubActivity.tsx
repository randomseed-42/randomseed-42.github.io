import { useEffect, useState } from 'react'
import { GitFork, Star } from 'lucide-react'
import { site } from '../site'

interface Repo {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  pushed_at: string
  fork: boolean
  owner: { login: string }
}

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ok'; repos: Repo[] }

// Public, unauthenticated GitHub API: 60 requests/hour per visitor IP, which is plenty here.
async function fetchRepos(user: string): Promise<Repo[]> {
  const res = await fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=12`)
  if (!res.ok) throw new Error(`${user}: ${res.status}`)
  return res.json()
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days < 1) return 'today'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export default function GitHubActivity() {
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    Promise.allSettled(site.githubAccounts.map(fetchRepos)).then((results) => {
      const repos = results
        .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
        .filter((r) => !r.fork && r.name.toLowerCase() !== `${r.owner.login}.github.io`.toLowerCase())
        .filter((r) => !site.hiddenRepos.includes(r.full_name))
        .sort((a, b) => b.pushed_at.localeCompare(a.pushed_at))
        .slice(0, 6)
      setState(repos.length ? { kind: 'ok', repos } : { kind: 'error' })
    })
  }, [])

  if (state.kind === 'loading') {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg border border-ink-800 bg-ink-900" />
        ))}
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <p className="text-sm text-ink-400">
        Public repositories couldn't be loaded. Browse them on{' '}
        {site.githubAccounts.map((u, i) => (
          <span key={u}>
            {i > 0 && ' and '}
            <a className="text-accent-400 hover:underline" href={`https://github.com/${u}`}>
              github.com/{u}
            </a>
          </span>
        ))}
        .
      </p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {state.repos.map((r) => (
        <a
          key={r.id}
          href={r.html_url}
          className="group flex flex-col rounded-lg border border-ink-800 bg-ink-900 p-4 transition hover:border-ink-600"
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate font-medium text-ink-100 group-hover:text-accent-300">{r.name}</span>
            <span className="shrink-0 text-xs text-ink-400">{timeAgo(r.pushed_at)}</span>
          </div>
          <span className="text-xs text-ink-400">{r.owner.login}</span>
          <p className="mt-2 line-clamp-2 flex-1 text-sm text-ink-300">{r.description ?? 'No description'}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-ink-400">
            {r.language && <span>{r.language}</span>}
            <span className="flex items-center gap-1">
              <Star size={12} /> {r.stargazers_count}
            </span>
            <span className="flex items-center gap-1">
              <GitFork size={12} /> {r.forks_count}
            </span>
          </div>
        </a>
      ))}
    </div>
  )
}
