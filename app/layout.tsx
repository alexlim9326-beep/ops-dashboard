import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ops Dashboard',
  description: 'Sales pipeline, leads, tasks, meetings & deadlines',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
