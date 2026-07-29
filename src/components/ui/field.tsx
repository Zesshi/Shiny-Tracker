import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type FieldProps = {
  /** Rendered as a <label> bound to the control via htmlFor. */
  label: ReactNode
  /** id of the control this field wraps. */
  htmlFor: string
  /** Helper text shown below the control. */
  hint?: ReactNode
  /** Validation message. When set, the control is styled and marked invalid. */
  error?: ReactNode
  /** Visually hide the label but keep it available to screen readers. */
  hideLabel?: boolean
  hintId?: string
  errorId?: string
  className?: string
  children: ReactNode
}

/**
 * Layout + accessible wiring for a single form control.
 *
 * Every control in the app goes through this so that a label, a hint and an
 * error message are always associated with the input rather than floating
 * next to it.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  hideLabel,
  hintId,
  errorId,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className={cn(
          'text-sm font-medium text-ink-muted',
          hideLabel && 'sr-only',
        )}
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-center gap-1.5 text-xs text-danger">
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="size-3.5 shrink-0 fill-current"
          >
            <path d="M8 1.5 15 14H1L8 1.5Zm0 4.25a.75.75 0 0 0-.75.75v2.5a.75.75 0 0 0 1.5 0V6.5A.75.75 0 0 0 8 5.75Zm0 5.25a.85.85 0 1 0 0 1.7.85.85 0 0 0 0-1.7Z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

/** Shared control chrome, so Input / Select / Textarea look identical. */
export const controlBase =
  'w-full rounded-md border bg-canvas text-ink placeholder:text-ink-subtle ' +
  'transition-colors duration-(--transition-fast) ' +
  'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-55'

export const controlState = {
  normal: 'border-line focus-visible:outline-brand-hover focus-visible:border-brand',
  invalid: 'border-danger focus-visible:outline-danger',
}

export const controlSizes = {
  sm: 'h-8 px-2.5 text-xs',
  md: 'h-10 px-3 text-sm',
  lg: 'h-11 px-3.5 text-sm',
}

export type ControlSize = keyof typeof controlSizes
