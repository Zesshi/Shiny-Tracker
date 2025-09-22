import './globals.css'
import Nav from '@/components/nav'
import PWARegister from '@/components/PWARegister'

export const metadata = { title: 'Shiny Tracker' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body>
        <PWARegister />
        <Nav />
        {children}
      </body>
    </html>
  )
}
