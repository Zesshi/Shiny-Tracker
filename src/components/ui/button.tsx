import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'shine'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap ' +
  'rounded-md border transition-colors duration-(--transition-fast) ' +
  'disabled:cursor-not-allowed disabled:opacity-55 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-hover'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-brand-ink border-transparent hover:bg-brand-hover active:bg-brand',
  secondary:
    'bg-chip text-ink border-line hover:bg-surface-hover hover:border-line-strong',
  ghost:
    'bg-transparent text-ink-muted border-transparent hover:bg-surface-hover hover:text-ink',
  danger:
    'bg-danger-soft text-danger border-danger/40 hover:bg-danger hover:text-canvas',
  shine:
    'bg-shine-soft text-shine border-shine/40 hover:border-shine/70 hover:bg-shine/15',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
}

type BaseProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

export type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', fullWidth, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    />
  )
})

type LinkButtonProps = BaseProps & {
  href: string
  children: React.ReactNode
  className?: string
  'aria-label'?: string
  title?: string
}

/** Anchor styled as a button. Use for navigation; use Button for actions. */
export function LinkButton({
  href,
  variant = 'secondary',
  size = 'md',
  fullWidth,
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    />
  )
}
