type ClassValue =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | ClassValue[]

/**
 * Minimal class-name joiner (clsx-style), kept local to avoid a dependency
 * for something this small.
 *
 * Note: this does NOT resolve conflicting Tailwind utilities the way
 * `tailwind-merge` would. Components in src/components/ui therefore expose
 * explicit `variant`/`size` props rather than expecting callers to override
 * base utilities via `className`. Use `className` for additive concerns
 * (layout, spacing, width) only.
 */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = []
  for (const input of inputs) {
    if (!input) continue
    if (Array.isArray(input)) {
      const nested = cn(...input)
      if (nested) out.push(nested)
    } else if (typeof input === 'string' || typeof input === 'number') {
      // Booleans/bigints are accepted by the type so that guards like
      // `someReactNode && 'class'` typecheck, but only strings and numbers
      // are ever emitted.
      out.push(String(input))
    }
  }
  return out.join(' ')
}
