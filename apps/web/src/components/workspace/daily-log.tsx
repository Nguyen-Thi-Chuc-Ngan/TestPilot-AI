'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Save, Loader2, CalendarDays, Smile, Meh, Frown, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { useLang } from '@/stores/language-store'
import { cn } from '@/lib/utils'

interface Log {
  id?: string
  log_date: string
  tested?: string
  bugs_found?: string
  blockers?: string
  pending?: string
  notes?: string
  mood?: string
}

const MOOD_CONFIG = {
  good:    { icon: Smile,  label: 'Good day',  color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  normal:  { icon: Meh,    label: 'Normal',    color: 'text-yellow-500',  bg: 'bg-yellow-500/10 border-yellow-500/30' },
  stressed:{ icon: Frown,  label: 'Stressed',  color: 'text-red-500',     bg: 'bg-red-500/10 border-red-500/30' },
}

const areaCls = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none'

export function DailyLog() {
  const { lang } = useLang()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [log, setLog] = useState<Log>({ log_date: selectedDate, mood: 'normal' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  async function loadLog(date: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', date).single()
    setLog(data ?? { log_date: date, mood: 'normal' })
  }

  useEffect(() => { loadLog(selectedDate) }, [selectedDate])

  function changeDate(days: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  async function saveLog() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const payload = { ...log, user_id: user.id, log_date: selectedDate }
    if (log.id) {
      await supabase.from('daily_logs').update(payload).eq('id', log.id)
    } else {
      const { data } = await supabase.from('daily_logs').insert(payload).select().single()
      if (data) setLog(data)
    }
    toast.success(t('Log saved!', 'Da luu!'))
    setSaving(false)
    loadLog(selectedDate)
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0]
  const moodCfg = MOOD_CONFIG[log.mood as keyof typeof MOOD_CONFIG] ?? MOOD_CONFIG.normal

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-violet-500" />
            {lang === 'vi' ? 'Nhật Ký QA' : 'Daily QA Log'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'vi' ? 'Ghi lại hoạt động test hàng ngày' : 'Log your daily testing activity'}
          </p>
        </div>
      </div>

      {/* Date navigator */}
      <div className="flex items-center gap-2">
        {/* Prev */}
        <button onClick={() => changeDate(-1)}
          className="rounded-lg border border-border bg-card p-2 hover:bg-muted transition-colors">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Date picker — native input styled */}
        <label className="flex-1 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 cursor-pointer hover:border-violet-500/50 hover:bg-muted/30 transition-all group">
          <CalendarDays className="h-4 w-4 text-violet-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              {new Date(selectedDate + 'T12:00').toLocaleDateString(
                lang === 'vi' ? 'vi-VN' : 'en-US',
                { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
              )}
            </p>
            {isToday
              ? <span className="text-[10px] text-violet-500 font-bold">{lang === 'vi' ? 'Hôm nay' : 'Today'}</span>
              : <span className="text-[10px] text-muted-foreground">{lang === 'vi' ? 'Nhấn để chọn ngày khác' : 'Click to pick a date'}</span>
            }
          </div>
          <input
            type="date"
            value={selectedDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="w-32 text-xs text-muted-foreground bg-transparent border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500/50 cursor-pointer"
          />
        </label>

        {/* Next */}
        <button onClick={() => changeDate(1)} disabled={isToday}
          className="rounded-lg border border-border bg-card p-2 hover:bg-muted transition-colors disabled:opacity-30">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Jump to today */}
        {!isToday && (
          <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-500 px-3 py-2 text-xs font-medium hover:bg-violet-500/20 transition-colors whitespace-nowrap">
            {lang === 'vi' ? 'Hôm nay' : 'Today'}
          </button>
        )}
      </div>

      {/* Mood selector */}
      <div className="flex gap-2">
        <span className="text-sm text-muted-foreground self-center mr-1">{t('Today was:', 'Hom nay:')}</span>
        {Object.entries(MOOD_CONFIG).map(([key, cfg]) => (
          <button key={key} onClick={() => setLog((l) => ({ ...l, mood: key }))}
            className={cn('flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all',
              log.mood === key ? cn(cfg.bg, cfg.color) : 'border-border text-muted-foreground hover:bg-muted')}>
            <cfg.icon className="h-3.5 w-3.5" />
            {t(cfg.label, cfg.label)}
          </button>
        ))}
      </div>

      {/* Log fields */}
      <div className="space-y-4">
        {([
          { key: 'tested',     label: t('What was tested today?', 'Test gi hom nay?'),            placeholder: t('e.g. QR parser edge cases, checkout flow, Android regression...', 'vd: QR parser, checkout, regression Android...') },
          { key: 'bugs_found', label: t('Bugs found', 'Bug phat hien'),                           placeholder: t('Describe bugs found, severities, affected modules...', 'Mo ta bug, severity, module bi anh huong...') },
          { key: 'blockers',   label: t('Blockers', 'Blockers'),                                  placeholder: t('Anything blocking your work?', 'Co gi dang chan cong viec khong?') },
          { key: 'pending',    label: t('Pending / Need follow-up', 'Con lai / Can theo doi'),    placeholder: t('Pending retests, waiting for dev fix, unclear requirements...', 'Can retest, cho dev fix, yeu cau chua ro...') },
          { key: 'notes',      label: t('Notes / Observations', 'Ghi chu / Nhan xet'),            placeholder: t('Any insights, risks, or things to remember...', 'Bat cu dieu gi can ghi lai...') },
        ] as { key: keyof Log; label: string; placeholder: string }[]).map((f) => (
          <motion.div key={f.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">{f.label}</label>
            <textarea
              value={String(log[f.key] ?? '')}
              onChange={(e) => setLog((l) => ({ ...l, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              rows={f.key === 'tested' ? 4 : 2}
              className={areaCls}
            />
          </motion.div>
        ))}
      </div>

      <div className="flex justify-end">
        <GlowButton onClick={saveLog} loading={saving} icon={<Save className="h-4 w-4" />}>
          {lang === 'vi' ? 'Lưu nhật ký' : 'Save log'}
        </GlowButton>
      </div>

    </div>
  )
}
