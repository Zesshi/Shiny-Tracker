import type { Metadata, Viewport } from 'next'
import './globals.css'
import Nav from '@/components/nav'
import PWARegister from '@/components/PWARegister'
import { AuthProvider } from '@/components/auth-provider'

export const metadata: Metadata = {
  title: 'Shiny Tracker',
  description: 'Track your shiny Pokémon collection across every generation.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' },
}

export const viewport: Viewport = {
  themeColor: '#0d1117',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        <AuthProvider>
          <PWARegister />
          <a
            href="#main"
            className="sr-only rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-ink focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
          >
            Skip to content
          </a>
          <Nav />
          <main id="main">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
