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
  title: 'STEG Cut Tracker — Tunisia Power Outage Map',
  description:
    'Real-time power outage tracking map for Tunisia. Report and monitor STEG electricity cuts with live community updates.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    title: 'STEG Cut Tracker — Tunisia',
    description: 'Live power outage map for Tunisia. Report and track STEG cuts.',
    type: 'website',
    locale: 'fr_TN',
    siteName: 'STEG Cut Tracker',
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
