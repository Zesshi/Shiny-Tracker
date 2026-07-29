'use client'

import { useRef } from 'react'
import { cn } from '@/lib/cn'

export type TabItem<T extends string> = {
  value: T
  label: string
}

export type TabsProps<T extends string> = {
  items: readonly TabItem<T>[]
  value: T
  onChange: (value: T) => void
  /** Accessible name for the tablist. */
  label: string
  /** id prefix used to wire aria-controls to the matching TabPanel. */
  idPrefix: string
  className?: string
}

/**
 * Accessible tablist with arrow-key roving focus (WAI-ARIA tabs pattern).
 * Pair with <TabPanel> using the same idPrefix.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  idPrefix,
  className,
}: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null)

  function onKeyDown(e: React.KeyboardEvent) {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (dir === 0) return
    e.preventDefault()
    const index = items.findIndex(i => i.value === value)
    const next = items[(index + dir + items.length) % items.length]
    onChange(next.value)
    listRef.current
      ?.querySelector<HTMLButtonElement>(`#${idPrefix}-tab-${next.value}`)
      ?.focus()
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        'flex gap-1 rounded-lg border border-line bg-canvas p-1',
        className,
      )}
    >
      {items.map(item => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            id={`${idPrefix}-tab-${item.value}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${item.value}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-sm font-semibold',
              'transition-colors duration-(--transition-fast)',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-hover',
              active
                ? 'bg-brand text-brand-ink'
                : 'text-ink-muted hover:bg-surface-hover hover:text-ink',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({
  value,
  idPrefix,
  children,
  className,
}: {
  value: string
  idPrefix: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${value}`}
      aria-labelledby={`${idPrefix}-tab-${value}`}
      tabIndex={0}
      className={cn('focus-visible:outline-none', className)}
    >
      {children}
    </div>
  )
}
