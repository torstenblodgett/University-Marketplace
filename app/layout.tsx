import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/ui/Navbar'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'McGill Marketplace',
  description: 'Buy, sell, and find services — for McGill students, by McGill students.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Navbar />
        <main className="min-h-screen pb-16 md:pb-0">
          {children}
        </main>
      </body>
    </html>
  )
}
