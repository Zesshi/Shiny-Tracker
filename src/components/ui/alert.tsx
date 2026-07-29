import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type AlertTone = 'info' | 'success' | 'error' | 'warning'

const tones: Record<AlertTone, { box: string; icon: string; path: string }> = {
  info: {
    box: 'border-brand/40 bg-brand-soft text-ink',
    icon: 'text-brand',
    path: 'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 3a.9.9 0 1 1 0 1.8A.9.9 0 0 1 8 4Zm1 8H7V7h2v5Z',
  },
  success: {
    box: 'border-success/40 bg-success-soft text-ink',
    icon: 'text-success',
    path: 'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm3.4 5.1-4 4a.75.75 0 0 1-1.06 0L4.6 8.4a.75.75 0 1 1 1.06-1.06l1.21 1.2 3.47-3.5A.75.75 0 1 1 11.4 6.1Z',
  },
  error: {
    box: 'border-danger/40 bg-danger-soft text-ink',
    icon: 'text-danger',
    path: 'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM7 4h2v5H7V4Zm0 6.2h2V12H7v-1.8Z',
  },
  warning: {
    box: 'border-warning/40 bg-warning-soft text-ink',
    icon: 'text-warning',
    path: 'M8 1.5 15 14H1L8 1.5Zm-1 4.75v3h2v-3H7Zm0 4.25V12h2v-1.5H7Z',
  },
}

export type AlertProps = {
  children: ReactNode
  tone?: AlertTone
  title?: ReactNode
  className?: string
  action?: ReactNode
}

/**
 * Inline feedback banner.
 *
 * Errors and warnings use role="alert" (assertive) so they interrupt; info and
 * success use role="status" (polite) so they are announced without stealing
 * focus from what the user is doing.
 */
export function Alert({ children, tone = 'info', title, className, action }: AlertProps) {
  const t = tones[tone]
  const assertive = tone === 'error' || tone === 'warning'

  return (
    <div
      role={assertive ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-md border px-3.5 py-3 text-sm',
        t.box,
        className,
      )}
    >
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className={cn('mt-0.5 size-4 shrink-0 fill-current', t.icon)}
      >
        <path d={t.path} />
      </svg>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn('text-ink-muted', title && 'mt-0.5')}>{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
