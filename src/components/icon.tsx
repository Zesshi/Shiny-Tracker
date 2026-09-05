import type { SVGProps } from 'react'

export type IconName =
  | 'sparkles'
  | 'grid'
  | 'users'
  | 'settings'
  | 'logout'
  | 'search'
  | 'chevron'
  | 'arrow'
  | 'check'
  | 'plus'
  | 'globe'
  | 'lock'
  | 'close'
  | 'target'
  | 'trophy'

const paths: Record<IconName, React.ReactNode> = {
  sparkles: (
    <>
      <path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z" />
      <path d="m20 2 .6 1.4L22 4l-1.4.6L20 6l-.6-1.4L18 4l1.4-.6L20 2Z" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5" />
    </>
  ),
  settings: (
    <>
      <path d="m9 3-.6 2.2-2 .9L4.3 6 2.8 8.6l1.5 1.7v2.4l-1.5 1.7L4.3 17l2.1-.1 2 .9L9 20h3l.6-2.2 2-.9 2.1.1 1.5-2.6-1.5-1.7v-2.4l1.5-1.7L16.7 6l-2.1.1-2-.9L12 3H9Z" />
      <circle cx="10.5" cy="11.5" r="3" />
    </>
  ),
  logout: <path d="M9 4H4v16h5m5-12 4 4-4 4M8 12h13" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  trophy: (
    <path d="M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v6m-4 1h8" />
  ),
}

export function Icon({
  name,
  className = '',
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`icon ${className}`}
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
