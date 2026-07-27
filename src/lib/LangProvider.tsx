'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Lang } from './i18n'

interface LangContextValue {
  lang: Lang
  dir: 'ltr' | 'rtl'
  setLang: (l: Lang) => void
}

const LangContext = createContext<LangContextValue>({
  lang: 'fr',
  dir: 'ltr',
  setLang: () => {},
})

export function useLang() {
  return useContext(LangContext)
}

const DIR_MAP: Record<Lang, 'ltr' | 'rtl'> = { fr: 'ltr', ar: 'rtl', en: 'ltr' }

function applyLang(l: Lang) {
  document.documentElement.lang = l
  document.documentElement.dir = DIR_MAP[l]
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr')

  useEffect(() => {
    const stored = localStorage.getItem('steg-lang') as Lang | null
    if (stored && ['fr', 'ar', 'en'].includes(stored)) {
      setLangState(stored)
      applyLang(stored)
    }
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem('steg-lang', l)
    applyLang(l)
  }, [])

  const value = useMemo(
    () => ({ lang, dir: DIR_MAP[lang], setLang }),
    [lang, setLang],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}
