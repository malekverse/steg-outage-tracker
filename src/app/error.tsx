'use client'

export default function Error({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-subtle">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-danger-light rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-danger"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">Something went wrong</h1>
        <p className="text-text-secondary mb-8 leading-relaxed">
          We couldn&apos;t load the outage map. This might be a temporary issue.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/25"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Try again
        </button>
      </div>
    </div>
  )
}
