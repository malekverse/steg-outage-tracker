import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import SwCleanup from '@/components/SwCleanup'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ef4444',
}

export const metadata: Metadata = {
  title: 'Win El Dhaw — Tunisia Power Outage Map',
  description:
    'Real-time community power outage map for Tunisia. Report cuts with GPS, see live zones, and get nearby alerts.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    title: 'Win El Dhaw — Tunisia',
    description: 'Live power outage map for Tunisia. Where is the light?',
    type: 'website',
    locale: 'fr_TN',
    siteName: 'Win El Dhaw',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-bg text-text antialiased`}>
        <SwCleanup />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
