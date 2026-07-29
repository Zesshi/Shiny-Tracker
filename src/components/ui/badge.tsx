import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'shine'
  | 'success'
  | 'danger'
  | 'warning'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-chip text-ink-muted border-line',
  brand: 'bg-brand-soft text-brand border-brand/40',
  shine: 'bg-shine-soft text-shine border-shine/40',
  success: 'bg-success-soft text-success border-success/40',
  danger: 'bg-danger-soft text-danger border-danger/40',
  warning: 'bg-warning-soft text-warning border-warning/40',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1',
        'text-xs font-medium whitespace-nowrap tabular-nums',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
