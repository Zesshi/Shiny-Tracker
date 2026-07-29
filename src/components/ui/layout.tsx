import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

const widths = {
  sm: 'max-w-lg',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-7xl',
}

export type ContainerWidth = keyof typeof widths

/** Horizontal page gutter + max width. The only place page padding is set. */
export function Container({
  children,
  width = 'xl',
  className,
}: {
  children: ReactNode
  width?: ContainerWidth
  className?: string
}) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6', widths[width], className)}>
      {children}
    </div>
  )
}

/** Standard page top section: title, optional description, optional actions. */
export function PageHeader({
  title,
  description,
  actions,
  back,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  back?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('py-5 sm:py-6', className)}>
      {back && <div className="mb-3">{back}</div>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-ink-muted">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  )
}

/** Thin completion bar. Decorative by default — pair with a visible count. */
export function Progress({
  value,
  max,
  className,
  tone = 'brand',
  label,
}: {
  value: number
  max: number
  className?: string
  tone?: 'brand' | 'shine'
  label?: string
}) {
  const safeMax = max > 0 ? max : 1
  const pct = Math.min(100, Math.max(0, (value / safeMax) * 100))

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-chip', className)}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-(--transition-base)',
          tone === 'shine' ? 'bg-shine' : 'bg-brand',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
