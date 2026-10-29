// Small building blocks in the Care Intelligence style: white cards with a 12px radius,
// hairline borders, 22px panel headers, quote blocks in Georgia with a left rule.

import type { ReactNode } from 'react'
import { cx } from '../../shared/ui'

export function RWCard({ className, children, dashed }: { className?: string; children: ReactNode; dashed?: boolean }) {
  return (
    <div className={cx('rounded-xl border bg-rw-card shadow-[0_1px_2px_rgba(19,35,57,.05)]', dashed ? 'border-dashed border-rw-faint/60' : 'border-rw-line', className)}>{children}</div>
  )
}

export function PanelTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-[22px] leading-tight font-bold text-rw-ink">{children}</h2>
      {sub && <p className="mt-1 text-sm text-rw-muted">{sub}</p>}
    </div>
  )
}

export function CardTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h3 className="text-[15px] font-semibold text-rw-ink">{children}</h3>
      {aside && <span className="text-xs text-rw-faint">{aside}</span>}
    </div>
  )
}

export function Quote({ children, hidden }: { children: ReactNode; hidden?: boolean }) {
  if (hidden) return null
  return <blockquote className="my-2 border-l-[3px] border-rw-line pl-3 font-quote text-[15px] leading-relaxed text-rw-ink/90 italic">“{children}”</blockquote>
}

export function Foot({ children }: { children: ReactNode }) {
  return <p className="mt-3 border-t border-rw-line pt-2 text-xs text-rw-faint">{children}</p>
}

export function Badge({ children, tone = 'neutral', title }: { children: ReactNode; tone?: 'neutral' | 'captured' | 'recalled' | 'signal' | 'ochre' | 'caution'; title?: string }) {
  const cls = {
    neutral: 'bg-rw-soft text-rw-muted border-rw-line',
    captured: 'bg-rw-captured/10 text-rw-captured border-rw-captured/30',
    recalled: 'bg-rw-recalled/10 text-rw-recalled border-rw-recalled/30',
    signal: 'bg-rw-signal/10 text-rw-signal border-rw-signal/30',
    ochre: 'bg-rw-ochre/10 text-rw-ochre border-rw-ochre/40',
    caution: 'bg-rw-caution text-rw-ochre border-rw-ochre/30',
  }[tone]
  return (
    <span title={title} className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium', cls)}>
      {children}
    </span>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-rw-faint italic">{children}</p>
}

export function RWButton({ children, onClick, variant = 'primary', disabled, className }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'link'; disabled?: boolean; className?: string }) {
  const cls = {
    primary: 'rounded-lg bg-rw-captured px-3 py-1.5 text-sm font-semibold text-white hover:bg-rw-captured/90 disabled:opacity-40',
    ghost: 'rounded-lg border border-rw-line bg-white px-3 py-1.5 text-sm font-medium text-rw-ink hover:bg-rw-soft disabled:opacity-40',
    link: 'text-sm font-medium text-rw-captured hover:underline disabled:opacity-40',
  }[variant]
  return (
    <button onClick={onClick} disabled={disabled} className={cx(cls, className)}>
      {children}
    </button>
  )
}

export const KIND_COLOR = {
  person: '#2e6da4',
  event: '#a99ede',
  place: '#1f7a52',
  organization: '#8a7433',
} as const

export const CHAPTER_PALETTE = ['#a99ede', '#8a7433', '#2e6da4', '#a8c07a', '#6b4a6e', '#1f7a52', '#e79c9c', '#6cc4bd']
