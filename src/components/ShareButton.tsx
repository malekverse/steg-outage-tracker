'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'

export default function ShareButton({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const data = {
      title: 'Win El Dhaw — Tunisia',
      text: 'Live power outage map for Tunisia',
      url: window.location.href,
    }

    if (navigator.share && window.innerWidth < 768) {
      try {
        await navigator.share(data)
      } catch {
        /* cancelled */
      }
      return
    }

    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  if (compact) {
    return (
      <button
        onClick={share}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl border border-border/50 bg-surface-hover text-text-secondary hover:text-text transition-colors"
        aria-label="Share"
      >
        <Share2 className="w-4 h-4" />
        {copied && (
          <span className="absolute -top-7 right-0 text-[10px] font-medium bg-text text-bg px-1.5 py-0.5 rounded whitespace-nowrap">
            Copied
          </span>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={share}
      className="relative flex items-center gap-2 bg-surface-hover text-text text-sm font-medium py-2.5 px-4 rounded-xl border border-border/50 hover:bg-border/30 transition-colors"
    >
      <Share2 className="w-4 h-4" />
      Share
    </button>
  )
}
