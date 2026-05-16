'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Languages } from 'lucide-react'
import { useLang, type Lang } from '@/stores/language-store'
import { useEffect, useState } from 'react'

export function ThemeLangToggle() {
  const { theme, setTheme } = useTheme()
  const { lang, setLang } = useLang()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const

  const langs: { value: Lang; label: string }[] = [
    { value: 'en', label: 'EN' },
    { value: 'vi', label: 'VI' },
  ]

  return (
    <div className="flex items-center gap-1">
      {/* Language toggle */}
      <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
        <Languages className="h-3.5 w-3.5 text-muted-foreground mx-1.5" />
        {langs.map((l) => (
          <button
            key={l.value}
            onClick={() => setLang(l.value)}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              lang === l.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Theme toggle */}
      <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
        {themes.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            title={label}
            className={`rounded p-1.5 transition-colors ${
              theme === value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </div>
  )
}
