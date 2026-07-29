import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/* -------------------------------------------------------------------------- */
/* Spinner                                                                     */
/* -------------------------------------------------------------------------- */

export function Spinner({
  className,
  label,
}: {
  className?: string
  /** When provided, the spinner is announced; otherwise it is decorative. */
  label?: string
}) {
  return (
    <span
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('inline-block', className)}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-full animate-spin">
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2.5"
          className="opacity-20"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                    */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'skeleton relative block overflow-hidden rounded-md bg-chip',
        className,
      )}
    />
  )
}

/**
 * Full-page loading state. Announced politely so screen-reader users are told
 * the page is working rather than sitting on silence.
 */
export function PageLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-20 text-ink-muted"
    >
      <Spinner className="size-6" />
      <p className="text-sm">{label}…</p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg',
        'border border-dashed border-line px-6 py-12 text-center',
        className,
      )}
    >
      {icon && <div className="mb-1 text-ink-subtle">{icon}</div>}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Error state                                                                 */
/* -------------------------------------------------------------------------- */

export function ErrorState({
  title = 'Something went wrong',
  description,
  action,
  className,
}: {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg',
        'border border-danger/40 bg-danger-soft px-6 py-12 text-center',
        className,
      )}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-6 fill-danger">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM7 4h2v5H7V4Zm0 6.2h2V12H7v-1.8Z" />
      </svg>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
