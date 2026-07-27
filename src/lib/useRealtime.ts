'use client'

import { useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

let channelCounter = 0

export function useRealtimeSubscription(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
  callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    const invoke = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      if (cancelled) return
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (!cancelled) callbackRef.current(payload)
      }, 500)
    }

    channelCounter++
    const name = `realtime-${table}-${event}-${channelCounter}`
    const channel = supabase.channel(name)

    channel.on('postgres_changes', { event, schema: 'public', table }, invoke)
    channel.subscribe()

    return () => {
      cancelled = true
      if (debounceTimer) clearTimeout(debounceTimer)
      supabase.removeChannel(channel)
    }
  }, [table, event])
}
