'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StickyNote, X, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/stores/language-store'

export function Scratchpad() {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()
  const { lang } = useLang()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('scratchpad').select('content').eq('user_id', user.id).single()
      if (data) setContent(data.content ?? '')
    }
    load()
  }, [])

  async function autoSave(val: string) {
    setContent(val)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('scratchpad').upsert({
        user_id: user.id,
        content: val,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      setSaving(false)
    }, 800)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        title={lang === 'vi' ? 'Ghi chu nhanh' : 'Quick scratchpad'}
        className="fixed bottom-6 right-6 z-40 h-11 w-11 rounded-full bg-violet-600 hover:bg-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.4)] flex items-center justify-center transition-all hover:scale-110"
      >
        <StickyNote className="h-5 w-5 text-white" />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-20 right-6 z-40 w-80 rounded-2xl border border-border bg-card shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-semibold">{lang === 'vi' ? 'Ghi chu nhanh' : 'Scratchpad'}</span>
              </div>
              <div className="flex items-center gap-1">
                {saving && <span className="text-[10px] text-muted-foreground">{lang === 'vi' ? 'đang lưu...' : 'saving...'}</span>}
                {!saving && content && <span className="text-[10px] text-emerald-500">{lang === 'vi' ? 'đã lưu' : 'saved'}</span>}
                <button onClick={() => setOpen(false)} className="rounded p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <textarea
              value={content}
              onChange={(e) => autoSave(e.target.value)}
              placeholder={lang === 'vi'
                ? 'Dan link, test data, OTP, SQL, ghi chu nhanh...'
                : 'Paste URLs, test data, OTP, SQL snippets, quick notes...'}
              className="w-full h-64 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none font-mono"
            />

            <div className="px-4 py-2 border-t border-border bg-muted/20">
              <p className="text-[10px] text-muted-foreground/40">
                {lang === 'vi' ? 'Tu dong luu • Khong ai xem duoc' : 'Auto-saved • Only visible to you'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
