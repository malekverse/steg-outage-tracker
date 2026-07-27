'use client'

import type { ReactNode } from 'react'
import { ThemeProvider } from '@/lib/ThemeProvider'
import { LangProvider } from '@/lib/LangProvider'
import { ToastProvider } from '@/components/Toast'

/** Lightweight providers for all routes (no outage fetching). */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LangProvider>
        <ToastProvider>{children}</ToastProvider>
      </LangProvider>
    </ThemeProvider>
  )
}
