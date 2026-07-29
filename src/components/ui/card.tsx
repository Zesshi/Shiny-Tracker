import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type CardProps = {
  children: ReactNode
  className?: string
  /** Adds hover affordance. Use for cards that are themselves interactive. */
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  as?: 'div' | 'section' | 'li' | 'article'
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5 sm:p-6',
}

export function Card({
  children,
  className,
  interactive,
  padding = 'md',
  as: Tag = 'div',
}: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-lg border border-line bg-surface shadow-sm',
        paddings[padding],
        interactive &&
          'transition-colors duration-(--transition-fast) hover:border-line-strong hover:bg-surface-hover',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
