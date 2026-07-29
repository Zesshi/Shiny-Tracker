'use client'

import { forwardRef, useId } from 'react'
import type { ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import {
  Field,
  controlBase,
  controlSizes,
  controlState,
  type ControlSize,
} from './field'

export type SelectOption<T extends string = string> = {
  value: T
  label: string
}

export type SelectProps<T extends string = string> = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'size' | 'children'
> & {
  label: ReactNode
  options: readonly SelectOption<T>[]
  hint?: ReactNode
  error?: ReactNode
  hideLabel?: boolean
  selectSize?: ControlSize
  fieldClassName?: string
}

function SelectInner<T extends string = string>(
  {
    label,
    options,
    hint,
    error,
    hideLabel,
    selectSize = 'md',
    className,
    fieldClassName,
    id,
    ...props
  }: SelectProps<T>,
  ref: React.ForwardedRef<HTMLSelectElement>,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const hintId = `${selectId}-hint`
  const errorId = `${selectId}-error`

  return (
    <Field
      label={label}
      htmlFor={selectId}
      hint={hint}
      error={error}
      hideLabel={hideLabel}
      hintId={hintId}
      errorId={errorId}
      className={fieldClassName}
    >
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            controlBase,
            controlSizes[selectSize],
            error ? controlState.invalid : controlState.normal,
            'cursor-pointer appearance-none pr-9',
            className,
          )}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-ink-subtle"
          fill="none"
        >
          <path
            d="M7 10l5 5 5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Field>
  )
}

export const Select = forwardRef(SelectInner) as <T extends string = string>(
  props: SelectProps<T> & { ref?: React.ForwardedRef<HTMLSelectElement> },
) => ReturnType<typeof SelectInner>
