import './globals.css'
import Nav from '@/components/nav'

export const metadata = { title: 'Shiny Tracker' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  )
}
