'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Beaker, Bug, Swords, AlertTriangle, Zap, Star, Flame, Trophy, Play, Lock } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { useLang } from '@/stores/language-store'
import { createClient } from '@/lib/supabase/client'
import { generateDailyMissions, type Mission, AVAILABLE_TEMPLATES, DIFFICULTIES } from '@/lib/lab/bug-engine'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const MODES = [
  {
    id:    'bug-hunt',
    icon:  Bug,
    title: 'Bug Hunt',
    title_vi: 'Săn Bug',
    desc:  'Find as many bugs as possible before time runs out.',
    desc_vi: 'Tìm càng nhiều bug càng tốt trước khi hết giờ.',
    color: 'border-red-500/30 bg-red-500/5',
    iconColor: 'text-red-400',
    href:  '/lab/bug-hunt',
    available: true,
  },
  {
    id:    'battle',
    icon:  Swords,
    title: 'AI Battle',
    title_vi: 'Đấu Với AI',
    desc:  'Race against the AI scanner. Who finds more bugs?',
    desc_vi: 'Đua với AI scanner. Ai tìm được nhiều bug hơn?',
    color: 'border-violet-500/30 bg-violet-500/5',
    iconColor: 'text-violet-400',
    href:  '/battle',
    available: true,
  },
  {
    id:    'panic',
    icon:  AlertTriangle,
    title: 'Panic Simulator',
    title_vi: 'Mô Phỏng Khủng Hoảng',
    desc:  'Production is down. Triage fast.',
    desc_vi: 'Production sập. Xử lý nhanh thôi.',
    color: 'border-orange-500/30 bg-orange-500/5',
    iconColor: 'text-orange-400',
    href:  '/panic',
    available: true,
  },
  {
    id:    'regression',
    icon:  Zap,
    title: 'Regression Rush',
    title_vi: 'Regression Rush',
    desc:  'Release in 15 minutes. Pick your 5 most critical test cases.',
    desc_vi: 'Release sau 15 phút. Chọn 5 test case quan trọng nhất.',
    color: 'border-blue-500/30 bg-blue-500/5',
    iconColor: 'text-blue-400',
    href:  '/lab/regression',
    available: false,
  },
  {
    id:    'exploratory',
    icon:  Beaker,
    title: 'Exploratory Lab',
    title_vi: 'Khám Phá Tự Do',
    desc:  'Free exploration with hidden edge cases and random behaviors.',
    desc_vi: 'Khám phá tự do với edge cases và hành vi ngẫu nhiên.',
    color: 'border-emerald-500/30 bg-emerald-500/5',
    iconColor: 'text-emerald-400',
    href:  '/lab/exploratory',
    available: false,
  },
  {
    id:    'root-cause',
    icon:  Flame,
    title: 'Root Cause',
    title_vi: 'Tìm Nguyên Nhân',
    desc:  'Given symptoms, logs and screenshots — guess the root cause.',
    desc_vi: 'Dựa vào triệu chứng, log, screenshot — đoán nguyên nhân.',
    color: 'border-yellow-500/30 bg-yellow-500/5',
    iconColor: 'text-yellow-400',
    href:  '/lab/root-cause',
    available: false,
  },
]

const RANK_CONFIG: Record<string, { color: string; next: string }> = {
  'QA Novice':       { color: 'text-gray-400',   next: 'QA Trainee (500 XP)' },
  'QA Trainee':      { color: 'text-green-400',  next: 'QA Junior (1500 XP)' },
  'QA Junior':       { color: 'text-blue-400',   next: 'QA Engineer (3000 XP)' },
  'QA Engineer':     { color: 'text-violet-400', next: 'QA Senior (6000 XP)' },
  'QA Senior':       { color: 'text-orange-400', next: 'QA Lead (10000 XP)' },
  'QA Lead':         { color: 'text-red-400',    next: 'QA Architect (20000 XP)' },
  'QA Architect':    { color: 'text-yellow-400', next: 'Max rank!' },
}

export function QALabHub() {
  const { lang } = useLang()
  const [missions, setMissions] = useState<Mission[]>([])
  const [progress, setProgress] = useState({ total_xp: 0, qa_rank: 'QA Novice', streak_days: 0, runs_completed: 0, bugs_found: 0 })
  const supabase = createClient()
  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load or create daily missions
      const today = new Date().toISOString().split('T')[0]
      const { data: existing } = await supabase.from('daily_missions').select('*').eq('user_id', user.id).eq('mission_date', today).single()
      if (existing) {
        setMissions(existing.missions)
      } else {
        const newMissions = generateDailyMissions()
        await supabase.from('daily_missions').insert({ user_id: user.id, mission_date: today, missions: newMissions })
        setMissions(newMissions)
      }

      // Load progress
      const { data: prog } = await supabase.from('player_progress').select('*').eq('user_id', user.id).single()
      if (prog) setProgress(prog)
    }
    load()
  }, [])

  const rankCfg = RANK_CONFIG[progress.qa_rank] ?? RANK_CONFIG['QA Novice']
  const xpToNext = progress.qa_rank === 'QA Architect' ? progress.total_xp :
    parseInt(rankCfg.next.match(/\d+/)?.[0] ?? '500')
  const xpPct = Math.min(100, Math.round((progress.total_xp / xpToNext) * 100))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Beaker className="h-6 w-6 text-violet-500" />
          {t('QA Simulation Lab', 'Phòng Thí Nghiệm QA')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('Dynamic AI-powered QA challenges. Different every time.', 'Thử thách QA được tạo động bằng AI. Mỗi lần một khác.')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Modes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mode grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MODES.map((mode, i) => (
              <motion.div key={mode.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <div className={cn('rounded-xl border p-4 h-full', mode.color, !mode.available && 'opacity-50')}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn('rounded-lg p-2 bg-white/5', mode.color)}>
                      <mode.icon className={cn('h-5 w-5', mode.iconColor)} />
                    </div>
                    {!mode.available && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        <Lock className="h-2.5 w-2.5" /> {t('Soon', 'Sắp ra')}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm mb-1">{lang === 'vi' ? mode.title_vi : mode.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{lang === 'vi' ? mode.desc_vi : mode.desc}</p>
                  {mode.available ? (
                    <Link href={mode.href}>
                      <GlowButton size="sm" className="w-full" icon={<Play className="h-3.5 w-3.5" />}>
                        {t('Play', 'Chơi')}
                      </GlowButton>
                    </Link>
                  ) : (
                    <button disabled className="w-full rounded-lg bg-muted text-muted-foreground px-3 py-1.5 text-xs font-medium cursor-not-allowed">
                      {t('Coming soon', 'Sắp ra mắt')}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Progress + Missions */}
        <div className="space-y-4">
          {/* Player card */}
          <GlassCard className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('font-bold text-sm', rankCfg.color)}>{progress.qa_rank}</p>
                <p className="text-xs text-muted-foreground">{progress.total_xp} XP total</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-orange-400">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-bold">{progress.streak_days}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{t('day streak', 'ngày streak')}</p>
              </div>
            </div>

            {/* XP bar */}
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{t('Next:', 'Tiếp:')} {rankCfg.next}</span>
                <span>{xpPct}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1, delay: 0.5 }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              {[
                { label: t('Runs', 'Lượt'), value: progress.runs_completed, color: 'text-violet-500' },
                { label: t('Bugs Found', 'Bug tìm được'), value: progress.bugs_found, color: 'text-red-500' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-muted/30 py-2">
                  <p className={cn('text-lg font-bold', s.color)}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Daily missions */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-yellow-500" />
              <p className="text-sm font-bold">{t('Daily Missions', 'Nhiệm Vụ Hàng Ngày')}</p>
            </div>
            {missions.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('Loading missions...', 'Đang tải...')}</p>
            ) : (
              <div className="space-y-3">
                {missions.map((m) => (
                  <div key={m.id} className={cn('rounded-lg border p-3 transition-all', m.completed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border')}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-xs font-medium leading-snug', m.completed && 'line-through text-muted-foreground')}>{m.title}</p>
                      <span className="text-[10px] text-yellow-500 font-bold flex-shrink-0">+{m.xp} XP</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>{m.current}/{m.target}</span>
                        {m.completed && <span className="text-emerald-500 font-bold">✓ Done</span>}
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', m.completed ? 'bg-emerald-500' : 'bg-violet-500')}
                          style={{ width: `${Math.min(100, (m.current/m.target)*100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
