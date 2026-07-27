'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { Check, X, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const icons: Record<ToastType, ReactNode> = {
  success: <Check className="w-5 h-5 text-success" strokeWidth={2.5} />,
  error: <X className="w-5 h-5 text-danger" strokeWidth={2.5} />,
  info: <Info className="w-5 h-5 text-secondary" strokeWidth={2.5} />,
}

const bgColors: Record<ToastType, string> = {
  success: 'bg-success-light/80 border-success/30',
  error: 'bg-danger-light/80 border-danger/30',
  info: 'bg-warning-light/80 border-secondary/30',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const timeouts = timeoutsRef.current
    return () => {
      timeouts.forEach(t => clearTimeout(t))
      timeouts.clear()
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timeoutsRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timeoutsRef.current.delete(id)
    }
  }, [])

  const addToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Math.random().toString(36).slice(2)
      setToasts(prev => [...prev, { id, message, type }])
      const timer = setTimeout(() => removeToast(id), 4000)
      timeoutsRef.current.set(id, timer)
    },
    [removeToast],
  )

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-99999 flex flex-col gap-2 max-w-sm w-full pointer-events-none safe-top">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-md animate-toast-in ${bgColors[t.type]}`}
            onClick={() => removeToast(t.id)}
          >
            {icons[t.type]}
            <p className="text-sm font-medium text-text flex-1">{t.message}</p>
            <button
              className="text-text-muted hover:text-text transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
