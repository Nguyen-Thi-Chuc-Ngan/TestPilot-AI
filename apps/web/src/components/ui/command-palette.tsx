'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ScanLine, Clock, FileText, Mic, Gamepad2, BookOpen, User, X, ArrowRight, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useLang } from '@/stores/language-store'

interface SearchResult {
  id: string
  type: 'scan' | 'note' | 'page' | 'interview'
  title: string
  subtitle?: string
  href: string
  icon: React.ElementType
}

const STATIC_PAGES: SearchResult[] = [
  { id: 'p1', type: 'page', title: 'Dashboard',         subtitle: 'Overview',                href: '/dashboard',  icon: LayoutDashboard },
  { id: 'p2', type: 'page', title: 'New Scan',          subtitle: 'Start AI scan',           href: '/scan/new',   icon: ScanLine },
  { id: 'p3', type: 'page', title: 'History',           subtitle: 'All scans',               href: '/history',    icon: Clock },
  { id: 'p4', type: 'page', title: 'Notes',             subtitle: 'QA journal',              href: '/notes',      icon: BookOpen },
  { id: 'p5', type: 'page', title: 'Interview Trainer', subtitle: 'Practice interviews',      href: '/interview',  icon: Mic },
  { id: 'p6', type: 'page', title: 'Battle Mode',       subtitle: 'Find bugs in challenges', href: '/game',       icon: Gamepad2 },
  { id: 'p7', type: 'page', title: 'Profile',           subtitle: 'Your QA stats & badges',  href: '/profile',    icon: User },
]

const typeLabel: Record<string, string> = {
  page:      'Page',
  scan:      'Scan',
  note:      'Note',
  interview: 'Interview',
}

const typeColor: Record<string, string> = {
  page:      'text-violet-400 bg-violet-500/10',
  scan:      'text-blue-400 bg-blue-500/10',
  note:      'text-emerald-400 bg-emerald-500/10',
  interview: 'text-orange-400 bg-orange-500/10',
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>(STATIC_PAGES)
  const [selected, setSelected] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const { lang } = useLang()

  // Ctrl+K shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults(STATIC_PAGES)
      setSelected(0)
    }
  }, [open])

  // Search Supabase
  useEffect(() => {
    if (!query.trim()) { setResults(STATIC_PAGES); return }
    const t = setTimeout(async () => {
      setLoading(true)
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { setLoading(false); return }

      const q = query.toLowerCase()

      // Filter static pages
      const pages = STATIC_PAGES.filter(
        (p) => p.title.toLowerCase().includes(q) || p.subtitle?.toLowerCase().includes(q)
      )

      // Search scans
      const { data: scans } = await sb
        .from('scan_jobs')
        .select('id, url, status, created_at')
        .eq('user_id', user.id)
        .ilike('url', `%${query}%`)
        .limit(4)

      const scanResults: SearchResult[] = (scans ?? []).map((s) => ({
        id: s.id,
        type: 'scan' as const,
        title: s.url,
        subtitle: `${s.status} · ${new Date(s.created_at).toLocaleDateString()}`,
        href: `/scan/${s.id}`,
        icon: ScanLine,
      }))

      // Search notes
      const { data: notes } = await sb
        .from('qa_notes')
        .select('id, title, content')
        .eq('user_id', user.id)
        .ilike('title', `%${query}%`)
        .limit(3)

      const noteResults: SearchResult[] = (notes ?? []).map((n) => ({
        id: n.id,
        type: 'note' as const,
        title: n.title,
        subtitle: (n.content ?? '').slice(0, 60) + '...',
        href: `/notes/${n.id}`,
        icon: BookOpen,
      }))

      setResults([...pages, ...scanResults, ...noteResults])
      setSelected(0)
      setLoading(false)
    }, 200)
    return () => clearTimeout(t)
  }, [query])

  // Keyboard nav
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
      if (e.key === 'Enter') {
        e.preventDefault()
        const r = results[selected]
        if (r) { router.push(r.href); setOpen(false) }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, results, selected, router])

  function navigate(href: string) {
    router.push(href)
    setOpen(false)
  }

  return (
    <>
      {/* Trigger button in topbar */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        {lang === 'vi' ? 'Tìm kiếm...' : 'Search...'}
        <kbd className="ml-2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Palette */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2"
            >
              <div className="rounded-2xl border border-white/10 bg-[#0d0d12]/95 backdrop-blur-xl shadow-[0_25px_80px_rgba(0,0,0,0.6),0_0_40px_rgba(124,58,237,0.1)]">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
                  <Search className="h-4 w-4 text-violet-400 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={lang === 'vi' ? 'Tìm scan, note, trang...' : 'Search scans, notes, pages...'}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                  />
                  {loading && <div className="h-4 w-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />}
                  <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto py-2">
                  {results.length === 0 ? (
                    <div className="py-8 text-center text-sm text-white/30">
                      {lang === 'vi' ? 'Không tìm thấy kết quả' : 'No results found'}
                    </div>
                  ) : (
                    <>
                      {/* Group by type */}
                      {(['page', 'scan', 'note', 'interview'] as const).map((type) => {
                        const group = results.filter((r) => r.type === type)
                        if (group.length === 0) return null
                        return (
                          <div key={type}>
                            <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25">
                              {typeLabel[type]}
                            </div>
                            {group.map((r, i) => {
                              const globalIdx = results.indexOf(r)
                              return (
                                <button
                                  key={r.id}
                                  onClick={() => navigate(r.href)}
                                  onMouseEnter={() => setSelected(globalIdx)}
                                  className={cn(
                                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                                    selected === globalIdx ? 'bg-violet-500/10' : 'hover:bg-white/[0.03]'
                                  )}
                                >
                                  <div className={cn('rounded-md p-1.5', typeColor[r.type])}>
                                    <r.icon className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white/90 truncate">{r.title}</p>
                                    {r.subtitle && <p className="text-xs text-white/35 truncate">{r.subtitle}</p>}
                                  </div>
                                  {selected === globalIdx && (
                                    <ArrowRight className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-white/[0.06] px-4 py-2 flex items-center gap-4 text-[10px] text-white/25 font-mono">
                  <span><kbd className="rounded border border-white/10 px-1">↑↓</kbd> navigate</span>
                  <span><kbd className="rounded border border-white/10 px-1">↵</kbd> open</span>
                  <span><kbd className="rounded border border-white/10 px-1">esc</kbd> close</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
