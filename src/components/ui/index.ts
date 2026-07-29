/**
 * Shared UI primitives.
 *
 * Import from '@/components/ui' rather than reaching into individual files,
 * so the surface of the design system stays visible in one place.
 */
export { Button, LinkButton } from './button'
export type { ButtonProps, ButtonSize, ButtonVariant } from './button'

export { Field } from './field'
export type { FieldProps } from './field'

export { Input, Checkbox } from './input'
export type { InputProps, CheckboxProps } from './input'

export { Select } from './select'
export type { SelectOption, SelectProps } from './select'

export { Card, CardHeader } from './card'
export type { CardProps } from './card'

export { Badge } from './badge'
export type { BadgeTone } from './badge'

export { Alert } from './alert'
export type { AlertProps, AlertTone } from './alert'

export { Tabs, TabPanel } from './tabs'
export type { TabItem, TabsProps } from './tabs'

export {
  Spinner,
  Skeleton,
  PageLoading,
  EmptyState,
  ErrorState,
} from './feedback'

export { Container, PageHeader, Progress } from './layout'
export type { ContainerWidth } from './layout'
