import type { ReactNode } from 'react'

/** Admin uses root providers only — no map/outage/realtime stack. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return children
}
