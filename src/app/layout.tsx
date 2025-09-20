import './globals.css'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'


export const metadata = { title: 'Shiny Tracker' }


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}