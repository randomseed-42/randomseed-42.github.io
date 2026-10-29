// Shared UI primitives for the demos and screenshot tours. Styled after the real apps' dark theme:
// navy surfaces, hairline borders, pink accent, Rajdhani for headings and tabs.

import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, X } from 'lucide-react'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-aiv-accent text-white hover:bg-aiv-accent-hover disabled:bg-aiv-accent/40',
  secondary:
    'border border-aiv-line-strong bg-aiv-surface text-aiv-text hover:border-aiv-muted disabled:text-aiv-faint',
  ghost: 'text-aiv-muted hover:text-aiv-text disabled:text-aiv-faint',
  danger: 'border border-aiv-bad/50 bg-aiv-bad/10 text-red-300 hover:bg-aiv-bad/20',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition disabled:cursor-not-allowed',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm',
        VARIANTS[variant],
        className,
      )}
    />
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-lg border border-aiv-line bg-aiv-surface', className)}>{children}</div>
}

export function CardTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 border-b border-aiv-line pb-3">
      <h3 className="font-display text-lg font-semibold tracking-wide text-aiv-text">{children}</h3>
      {aside}
    </div>
  )
}

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs text-aiv-muted">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} className="text-aiv-faint" />}
          {it.to ? (
            <Link to={it.to} className="hover:text-aiv-accent-soft">
              {it.label}
            </Link>
          ) : (
            <span className="text-aiv-text">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

/** Sticky action bar under the breadcrumb: left slot, optional centre title, right-aligned actions. */
export function ActionBar({ left, center, children }: { left?: ReactNode; center?: ReactNode; children?: ReactNode }) {
  return (
    <div className="sticky top-14 z-20 -mx-4 mt-3 flex items-center gap-3 border-b border-aiv-line bg-aiv-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="min-w-0 flex-1">{left}</div>
      {center && <div className="hidden min-w-0 truncate font-display text-lg font-semibold sm:block">{center}</div>}
      <div className="flex flex-1 flex-wrap items-center justify-end gap-2">{children}</div>
    </div>
  )
}

export function PageTitle({ title, subtitle, aside }: { title: string; subtitle?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mt-6 mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-aiv-line pb-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-wide">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-aiv-muted">{subtitle}</p>}
      </div>
      {aside}
    </div>
  )
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  accent = 'pink',
}: {
  tabs: { id: T; label: ReactNode; hidden?: boolean }[]
  active: T
  onChange: (id: T) => void
  accent?: 'pink' | 'blue'
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-aiv-line">
      {tabs
        .filter((t) => !t.hidden)
        .map((t) => {
          const on = t.id === active
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={cx(
                'shrink-0 border-b-2 px-4 py-2.5 font-display text-[15px] font-semibold tracking-wide transition',
                on
                  ? accent === 'pink'
                    ? 'border-aiv-accent text-aiv-accent-soft'
                    : 'border-[#0072B2] text-[#56B4E9]'
                  : 'border-transparent text-aiv-muted hover:text-aiv-text',
              )}
            >
              {t.label}
            </button>
          )
        })}
    </div>
  )
}

export type Status = 'pending' | 'running' | 'completed' | 'failed'

const STATUS_STYLE: Record<Status, string> = {
  pending: 'text-slate-300 border-slate-400/40 bg-slate-400/10',
  running: 'text-blue-300 border-aiv-info/40 bg-aiv-info/10',
  completed: 'text-green-300 border-aiv-ok/40 bg-aiv-ok/10',
  failed: 'text-red-300 border-aiv-bad/40 bg-aiv-bad/10',
}

export function StatusPill({ status }: { status: Status }) {
  return (
    <span className={cx('inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase', STATUS_STYLE[status])}>
      {status}
    </span>
  )
}

export type Severity = 'HIGH' | 'MED' | 'LOW'

export function SeverityBadge({ severity }: { severity: Severity }) {
  const cls = {
    HIGH: 'text-red-300 bg-aiv-bad/15 border-aiv-bad/40',
    MED: 'text-amber-300 bg-aiv-warn/10 border-aiv-warn/40',
    LOW: 'text-blue-300 bg-aiv-info/10 border-aiv-info/40',
  }[severity]
  return <span className={cx('inline-block w-12 shrink-0 rounded border py-0.5 text-center text-[10px] font-bold', cls)}>{severity}</span>
}

export function ProgressBar({ value, tone = 'info', className }: { value: number; tone?: 'info' | 'accent' | 'ok'; className?: string }) {
  const fill = {
    info: 'bg-gradient-to-r from-blue-500 to-cyan-400',
    accent: 'bg-aiv-accent',
    ok: 'bg-aiv-ok',
  }[tone]
  return (
    <div className={cx('h-2 overflow-hidden rounded-full bg-aiv-raised', className)}>
      <div className={cx('h-full rounded-full transition-[width] duration-300', fill)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Callout({ tone, title, children }: { tone: 'info' | 'ok' | 'warn' | 'bad'; title?: ReactNode; children?: ReactNode }) {
  const cls = {
    info: 'border-aiv-info/30 bg-aiv-info/10',
    ok: 'border-aiv-ok/30 bg-aiv-ok/10',
    warn: 'border-aiv-warn/30 bg-aiv-warn/10',
    bad: 'border-aiv-bad/30 bg-aiv-bad/10',
  }[tone]
  return (
    <div className={cx('rounded-lg border p-4 text-sm', cls)}>
      {title && <div className="mb-1 font-semibold text-aiv-text">{title}</div>}
      <div className="text-aiv-muted">{children}</div>
    </div>
  )
}

export function Modal({
  title,
  onClose,
  children,
  actions,
  wide,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  actions?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className={cx('w-full rounded-xl border border-aiv-line-strong bg-aiv-surface shadow-2xl', wide ? 'max-w-2xl' : 'max-w-md')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-aiv-line px-5 py-3">
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-aiv-muted hover:text-aiv-text" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 text-sm text-aiv-muted">{children}</div>
        {actions && <div className="flex justify-end gap-2 border-t border-aiv-line px-5 py-3">{actions}</div>}
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-aiv-line-strong px-6 py-14 text-center">
      <span className="text-4xl">{icon}</span>
      <div className="font-display text-lg font-semibold">{title}</div>
      <div className="text-sm text-aiv-muted">{children}</div>
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cx('inline-block h-5 w-5 animate-spin rounded-full border-2 border-aiv-accent border-t-transparent', className)} />
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null
  return (
    <div className="mt-6 flex items-center justify-center gap-1">
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cx(
            'h-8 w-8 rounded-md text-sm',
            p === page ? 'bg-aiv-accent text-white' : 'text-aiv-muted hover:bg-aiv-raised hover:text-aiv-text',
          )}
        >
          {p}
        </button>
      ))}
    </div>
  )
}

export function KV({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-aiv-line py-2 text-sm last:border-0">
      <span className="shrink-0 text-aiv-muted">{label}</span>
      <span className={cx('min-w-0 text-right break-all text-aiv-text', mono && 'font-mono text-xs')}>{children}</span>
    </div>
  )
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(2)} KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(2)} MB`
  return `${(n / 1024 ** 3).toFixed(2)} GB`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function download(filename: string, content: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
