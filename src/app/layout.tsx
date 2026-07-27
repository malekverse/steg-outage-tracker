import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import SwCleanup from '@/components/SwCleanup'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ef4444',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://steg-tracker.vercel.app'),
  title: 'Win El Dhaw — Tunisia Power Outage Map',
  description:
    'Real-time community power outage map for Tunisia. Report cuts with GPS, see live zones, and get nearby alerts.',
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png' }],
    apple: [{ url: '/icon.png', type: 'image/png' }],
  },
  openGraph: {
    title: 'Win El Dhaw — Tunisia',
    description: 'Live power outage map for Tunisia. Where is the light?',
    type: 'website',
    locale: 'fr_TN',
    siteName: 'Win El Dhaw',
    images: [
      {
        url: '/thumbnail.png',
        width: 1430,
        height: 736,
        alt: 'Win El Dhaw — Tunisia power outage map',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Win El Dhaw — Tunisia',
    description: 'Live power outage map for Tunisia. Where is the light?',
    images: ['/thumbnail.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-bg text-text antialiased`}>
        <SwCleanup />
        <Providers>{children}</Providers>
        <GoogleAnalytics />
      </body>
    </html>
  )
}
