'use client'

import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import {
  Field,
  controlBase,
  controlSizes,
  controlState,
  type ControlSize,
} from './field'

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  /** Required: enforces that every input in the app has a real label. */
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  hideLabel?: boolean
  inputSize?: ControlSize
  /** Rendered inside the control, before the text. */
  leading?: ReactNode
  fieldClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    hideLabel,
    inputSize = 'md',
    leading,
    className,
    fieldClassName,
    id,
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`

  const control = (
    <input
      ref={ref}
      id={inputId}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : hint ? hintId : undefined}
      className={cn(
        controlBase,
        controlSizes[inputSize],
        error ? controlState.invalid : controlState.normal,
        leading && 'pl-9',
        className,
      )}
      {...props}
    />
  )

  return (
    <Field
      label={label}
      htmlFor={inputId}
      hint={hint}
      error={error}
      hideLabel={hideLabel}
      hintId={hintId}
      errorId={errorId}
      className={fieldClassName}
    >
      {leading ? (
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-subtle"
          >
            {leading}
          </span>
          {control}
        </div>
      ) : (
        control
      )}
    </Field>
  )
})

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode
  hint?: ReactNode
}

export function Checkbox({ label, hint, id, className, ...props }: CheckboxProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`

  return (
    <div className="flex gap-3">
      <input
        id={inputId}
        type="checkbox"
        aria-describedby={hint ? hintId : undefined}
        className={cn(
          'mt-0.5 size-4 shrink-0 cursor-pointer rounded-sm border border-line',
          'bg-canvas accent-brand',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-hover',
          className,
        )}
        {...props}
      />
      <div className="flex flex-col gap-0.5">
        <label htmlFor={inputId} className="cursor-pointer text-sm text-ink">
          {label}
        </label>
        {hint && (
          <p id={hintId} className="text-xs text-ink-subtle">
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}
