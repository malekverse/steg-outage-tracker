'use client'

import { useState, useEffect, useCallback } from 'react'
import { tunisianGovernorates } from '@/lib/locationUtils'
import { useRealtimeSubscription } from '@/lib/useRealtime'

interface Report {
  id: string
  governorate: string
  delegation: string
  status: string
  source: string
  confirmations: number
  disputes: number
  created_at: string
  expired_at: string | null
  ip_address: string | null
  device_id: string | null
  signal_type: string | null
}

const STATUS_COLORS: Record<string, string> = {
  OFF: 'bg-danger',
  RESTORED: 'bg-success',
}

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterGov, setFilterGov] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [tab, setTab] = useState<'reports' | 'logs'>('reports')

  useEffect(() => {
    const pwd = sessionStorage.getItem('steg-admin-auth')
    if (pwd) checkPassword(pwd)
    else setChecking(false)
  }, [])

  async function checkPassword(pwd: string) {
    try {
      const res = await fetch('/api/admin-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      })
      if (res.ok) {
        setAuthed(true)
        sessionStorage.setItem('steg-admin-auth', pwd)
      }
    } catch {
      /* */
    }
    setChecking(false)
  }

  function getAuthHeader(): string {
    return sessionStorage.getItem('steg-admin-auth') || ''
  }

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      if (filterGov) params.set('governorate', filterGov)
      if (filterSource) params.set('source', filterSource)

      const res = await fetch(`/api/admin/reports?${params.toString()}`, {
        headers: { 'x-admin-password': getAuthHeader() },
      })

      if (res.ok) {
        const { reports: data } = await res.json()
        setReports(data ?? [])
      } else if (res.status === 401) {
        setAuthed(false)
        sessionStorage.removeItem('steg-admin-auth')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Server error (${res.status})`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    }
    setLoading(false)
  }, [filterGov, filterSource, filterStatus])

  useEffect(() => {
    if (authed) fetchReports()
  }, [fetchReports, authed])

  useEffect(() => {
    if (!authed) return
    const interval = setInterval(() => fetchReports(), 15_000)
    return () => clearInterval(interval)
  }, [authed, fetchReports])

  useRealtimeSubscription('outage_reports', '*', () => {
    if (authed) fetchReports()
  })

  async function updateStatus(id: string, status: string) {
    setActionLoading(id)
    try {
      await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': getAuthHeader(),
        },
        body: JSON.stringify({ id, status }),
      })
      fetchReports()
    } catch {
      /* */
    }
    setActionLoading(null)
  }

  async function deleteReport(id: string) {
    if (!confirm('Delete this report permanently?')) return
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': getAuthHeader(),
        },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== id))
      }
    } catch {
      /* */
    }
    setActionLoading(null)
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm">
          <div className="glass-strong rounded-2xl p-8 shadow-xl text-center">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-text mb-1">Admin Access</h1>
            <p className="text-sm text-text-secondary mb-6">
              Enter the admin password to continue.
            </p>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && checkPassword(password)}
              placeholder="Password"
              className="w-full bg-surface-hover border-2 border-border focus:border-primary rounded-xl px-4 py-3 text-sm text-text outline-none transition-colors mb-3"
              autoFocus
            />
            <button
              onClick={() => checkPassword(password)}
              disabled={!password}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all"
            >
              {checking ? 'Checking...' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="glass-strong sticky top-0 z-10 border-b border-border/50 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-text">Admin Panel</h1>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setTab('reports')}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${tab === 'reports' ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface-hover'}`}
              >
                Reports
              </button>
              <button
                onClick={() => setTab('logs')}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${tab === 'logs' ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface-hover'}`}
              >
                IP Logs
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">{reports.length} reports</span>
            <button
              onClick={() => {
                setAuthed(false)
                sessionStorage.removeItem('steg-admin-auth')
              }}
              className="text-xs text-text-secondary hover:text-text font-medium px-3 py-1.5 rounded-lg bg-surface-hover transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-xs font-medium text-text outline-none"
          >
            <option value="">All status</option>
            <option value="OFF">OFF</option>
            <option value="RESTORED">RESTORED</option>
          </select>
          <select
            value={filterGov}
            onChange={e => setFilterGov(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-xs font-medium text-text outline-none"
          >
            <option value="">All governorates</option>
            {tunisianGovernorates.map(g => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-xs font-medium text-text outline-none"
          >
            <option value="">All sources</option>
            <option value="USER">USER</option>
            <option value="BOT">BOT</option>
            <option value="SCRAPER">SCRAPER</option>
            <option value="SIGNAL">SIGNAL</option>
          </select>
          <button
            onClick={fetchReports}
            className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-text-muted text-sm">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm">No reports found.</div>
        ) : tab === 'reports' ? (
          <div className="space-y-2">
            {reports.map(r => (
              <div key={r.id} className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_COLORS[r.status] || 'bg-text-muted'}`}
                  />
                  <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div>
                      <div className="text-[10px] text-text-muted uppercase">Governorate</div>
                      <div className="font-medium text-text truncate">{r.governorate}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-text-muted uppercase">Delegation</div>
                      <div className="text-text truncate">{r.delegation || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-text-muted uppercase">Source</div>
                      <div className="text-text">{r.source}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-text-muted uppercase">Time</div>
                      <div className="text-text-secondary text-xs">{timeAgo(r.created_at)}</div>
                      {r.disputes > 0 && (
                        <div className="text-[10px] text-danger font-medium mt-0.5">{r.disputes} dispute{r.disputes > 1 ? 's' : ''}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {r.status === 'OFF' ? (
                    <button
                      onClick={() => updateStatus(r.id, 'RESTORED')}
                      disabled={actionLoading === r.id}
                      className="text-[11px] font-semibold bg-success/10 text-success px-2.5 py-1.5 rounded-lg hover:bg-success/20 transition-colors disabled:opacity-50"
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => updateStatus(r.id, 'OFF')}
                      disabled={actionLoading === r.id}
                      className="text-[11px] font-semibold bg-warning/10 text-secondary px-2.5 py-1.5 rounded-lg hover:bg-warning/20 transition-colors disabled:opacity-50"
                    >
                      Re-open
                    </button>
                  )}
                  <button
                    onClick={() => deleteReport(r.id)}
                    disabled={actionLoading === r.id}
                    className="text-[11px] font-semibold bg-danger/10 text-danger px-2.5 py-1.5 rounded-lg hover:bg-danger/20 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider border-b border-border/50">
              <div className="col-span-3 sm:col-span-2">IP Address</div>
              <div className="col-span-3 sm:col-span-2">Governorate</div>
              <div className="col-span-2 sm:col-span-2">Source</div>
              <div className="col-span-2 hidden sm:block">Device ID</div>
              <div className="col-span-2 sm:col-span-2">Time</div>
              <div className="col-span-2">Status</div>
            </div>
            {reports.map(r => (
              <div
                key={r.id}
                className="grid grid-cols-12 gap-2 px-4 py-2.5 rounded-lg hover:bg-surface-hover/50 text-xs items-center border-b border-border/20"
              >
                <div className="col-span-3 sm:col-span-2 font-mono text-text truncate">
                  {r.ip_address || '—'}
                </div>
                <div className="col-span-3 sm:col-span-2 text-text truncate">
                  {r.governorate}
                  {r.delegation ? <span className="text-text-muted"> · {r.delegation}</span> : null}
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      r.source === 'USER'
                        ? 'bg-danger/10 text-danger'
                        : r.source === 'SIGNAL'
                          ? 'bg-purple-500/10 text-purple-500'
                          : r.source === 'SCRAPER'
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-warning/10 text-secondary'
                    }`}
                  >
                    {r.source}
                  </span>
                </div>
                <div className="col-span-2 hidden sm:block font-mono text-text-muted truncate text-[10px]">
                  {r.device_id ? r.device_id.slice(0, 12) + '...' : '—'}
                </div>
                <div className="col-span-2 sm:col-span-2 text-text-secondary">
                  {timeAgo(r.created_at)}
                </div>
                <div className="col-span-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${STATUS_COLORS[r.status] || 'bg-text-muted'}`}
                  />
                  <span className="ml-1.5 text-text-muted">{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
