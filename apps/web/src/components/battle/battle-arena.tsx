'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, Bug, Timer, Trophy, Zap, Plus, ChevronRight, Brain, User } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { AIActivityFeed } from '@/components/ui/ai-activity-feed'
import { createClient } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { useLang } from '@/stores/language-store'
import { cn } from '@/lib/utils'

const BATTLE_TIME = 60 // seconds

// Demo page bugs (hidden answer key)
const ANSWER_KEY = [
  { id: 'b1', title: 'Submit button has no focus style',         severity: 'medium' },
  { id: 'b2', title: 'Password field shows plain text',          severity: 'high' },
  { id: 'b3', title: 'Missing required field indicators',        severity: 'medium' },
  { id: 'b4', title: 'Error message not cleared on new input',   severity: 'low' },
  { id: 'b5', title: 'No CSRF protection hint',                  severity: 'high' },
  { id: 'b6', title: 'Form lacks aria-describedby on error',     severity: 'medium' },
  { id: 'b7', title: 'Submit button text not descriptive',       severity: 'low' },
  { id: 'b8', title: 'No password strength indicator',           severity: 'low' },
]

const AI_ACTIVITY = [
  { type: 'ai' as const,      message: 'Initializing battle scan...' },
  { type: 'info' as const,    message: 'Navigating to challenge page' },
  { type: 'ai' as const,      message: 'Analyzing form structure' },
  { type: 'warn' as const,    message: 'Password field: plain text visible' },
  { type: 'ai' as const,      message: 'Checking WCAG accessibility' },
  { type: 'warn' as const,    message: 'Missing focus indicators on interactive elements' },
  { type: 'ai' as const,      message: 'Testing form submission edge cases' },
  { type: 'error' as const,   message: 'No CSRF token in form headers' },
  { type: 'ai' as const,      message: 'Analyzing aria attributes' },
  { type: 'warn' as const,    message: 'Error states lack aria-describedby' },
  { type: 'success' as const, message: 'AI found 6 bugs in 8.2 seconds' },
]

type Phase = 'intro' | 'battle' | 'aiScanning' | 'results'

interface BugReport { title: string }

export function BattleArena() {
  const { lang } = useLang()
  const [phase, setPhase] = useState<Phase>('intro')
  const [timeLeft, setTimeLeft] = useState(BATTLE_TIME)
  const [humanBugs, setHumanBugs] = useState<BugReport[]>([])
  const [newBug, setNewBug] = useState('')
  const [aiDone, setAiDone] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  function startBattle() {
    setPhase('battle')
    setTimeLeft(BATTLE_TIME)
    setHumanBugs([])
    setAiDone(false)

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          endBattle()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // AI scans in 8 seconds
    setTimeout(() => setAiDone(true), 8000)
  }

  function addBug() {
    if (!newBug.trim()) return
    setHumanBugs((prev) => [...prev, { title: newBug.trim() }])
    setNewBug('')
  }

  function endBattle() {
    clearInterval(timerRef.current!)
    setPhase('aiScanning')
    setTimeout(() => setPhase('results'), 3000)
  }

  useEffect(() => () => clearInterval(timerRef.current!), [])

  // Scoring
  const humanMatches  = humanBugs.filter((b) =>
    ANSWER_KEY.some((a) => a.title.toLowerCase().split(' ').some((w) => b.title.toLowerCase().includes(w)))
  ).length
  const humanScore    = Math.min(100, Math.round((humanMatches / ANSWER_KEY.length) * 100))
  const aiScore       = 75 // AI found 6/8
  const humanWins     = humanScore > aiScore
  const timerPct      = (timeLeft / BATTLE_TIME) * 100
  const timerColor    = timeLeft > 30 ? 'text-emerald-400' : timeLeft > 10 ? 'text-yellow-400' : 'text-red-400 animate-pulse'

  async function saveResult() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('battle_sessions').insert({
        user_id: user.id,
        challenge_id: 'login-form-v1',
        human_bugs: humanBugs.map((b) => b.title),
        ai_bugs: ANSWER_KEY.slice(0, 6).map((b) => b.title),
        human_score: humanScore,
        ai_score: aiScore,
        time_taken: BATTLE_TIME - timeLeft,
        winner: humanWins ? 'human' : 'ai',
      })
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (phase === 'results') saveResult()
  }, [phase])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
          <Swords className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('AI QA Battle Mode', 'Đấu Với AI')}</h1>
          <p className="text-sm text-muted-foreground">{t('60 seconds. Find more bugs than the AI.', '60 giây. Tìm nhiều bug hơn AI.')}</p>
        </div>
      </div>

      {/* Intro */}
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <GlassCard className="p-5 border border-blue-500/20 bg-blue-500/5">
                <div className="flex items-center gap-3 mb-3">
                  <User className="h-5 w-5 text-blue-400" />
                  <h3 className="font-bold text-blue-400">{t('You — Human Tester', 'Bạn — Tester')}</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>• {t('60 seconds on the clock', '60 giây để tìm bug')}</li>
                  <li>• {t('Report bugs you find', 'Báo bug bạn tìm được')}</li>
                  <li>• {t('Score based on accuracy', 'Điểm dựa trên độ chính xác')}</li>
                </ul>
              </GlassCard>
              <GlassCard className="p-5 border border-violet-500/20 bg-violet-500/5">
                <div className="flex items-center gap-3 mb-3">
                  <Brain className="h-5 w-5 text-violet-400" />
                  <h3 className="font-bold text-violet-400">{t('AI — TestPilot Scanner', 'AI — TestPilot')}</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>• {t('Scans in ~8 seconds', 'Quét trong ~8 giây')}</li>
                  <li>• {t('Uses vision + DOM analysis', 'Dùng vision + phân tích DOM')}</li>
                  <li>• {t('Finds 6 of 8 known bugs', 'Tìm được 6/8 bug đã biết')}</li>
                </ul>
              </GlassCard>
            </div>

            <GlassCard className="p-5 mb-6">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">{t('Challenge', 'Thử thách')}: Broken Login Form</p>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
                  <div className="flex gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-red-400"/><div className="h-2.5 w-2.5 rounded-full bg-yellow-400"/><div className="h-2.5 w-2.5 rounded-full bg-green-400"/></div>
                  <span className="text-xs text-muted-foreground font-mono">{lang === 'vi' ? 'Form Đăng Nhập — 8 bug ẩn' : 'Broken Login Form — 8 hidden bugs'}</span>
                </div>
                <iframe src="/demo-site/index.html" className="w-full h-48 bg-white" title="Challenge" />
              </div>
            </GlassCard>

            <div className="flex justify-center">
              <GlowButton onClick={startBattle} size="lg" icon={<Swords className="h-4 w-4" />}>
                {t('Start Battle!', 'Bắt đầu!')}
              </GlowButton>
            </div>
          </motion.div>
        )}

        {phase === 'battle' && (
          <motion.div key="battle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Timer bar */}
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t('Time remaining', 'Thời gian còn lại')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold font-mono ${timerColor}`}>{String(Math.floor(timeLeft/60)).padStart(2,'0')}:{String(timeLeft%60).padStart(2,'0')}</span>
                  {aiDone && (
                    <div className="flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-1">
                      <Brain className="h-3 w-3 text-violet-400" />
                      <span className="text-xs text-violet-400 font-bold">AI done!</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div className={cn('h-full rounded-full transition-colors', timeLeft > 30 ? 'bg-emerald-500' : timeLeft > 10 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${timerPct}%` }} />
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Demo page */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
                  <span className="text-xs text-muted-foreground font-mono">{lang === 'vi' ? 'Form Đăng Nhập — tìm bug đi!' : 'Broken Login Form — find the bugs!'}</span>
                </div>
                <iframe src="/demo-site/index.html" className="w-full h-80 bg-white" title="Find bugs" />
              </div>

              {/* Bug reporter */}
              <div className="space-y-3">
                <GlassCard className="p-4">
                  <p className="text-sm font-bold mb-3">{t('Report a bug', 'Báo bug')}</p>
                  <div className="flex gap-2">
                    <input
                      value={newBug}
                      onChange={(e) => setNewBug(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addBug()}
                      placeholder={t("Describe the bug... (press Enter)", "Mô tả bug... (nhấn Enter)")}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                    />
                    <button onClick={addBug} className="rounded-lg bg-violet-600 hover:bg-violet-500 px-3 py-2 text-white transition-colors">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </GlassCard>

                {humanBugs.length > 0 && (
                  <GlassCard className="p-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                      {t('Your bugs', 'Bug của bạn')} ({humanBugs.length})
                    </p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {humanBugs.map((b, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <Bug className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                          {b.title}
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                <GlowButton variant="danger" onClick={endBattle} className="w-full">
                  {t('Submit early', 'Nộp sớm')}
                </GlowButton>
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'aiScanning' && (
          <motion.div key="aiscanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GlassCard className="p-8 border border-violet-500/20 bg-violet-500/5 text-center space-y-4">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="h-16 w-16 rounded-2xl border-2 border-violet-500/50 border-t-violet-400 mx-auto" />
              <div>
                <h2 className="text-xl font-bold text-violet-400">{lang === 'vi' ? 'AI đang phân tích...' : 'AI is analyzing...'}</h2>
                <p className="text-sm text-muted-foreground mt-1">{lang === 'vi' ? 'So sánh kết quả trong 3 giây' : 'Comparing results in 3 seconds'}</p>
              </div>
              <div className="max-w-md mx-auto text-left">
                <AIActivityFeed lines={AI_ACTIVITY} maxLines={6} />
              </div>
            </GlassCard>
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Winner banner */}
            <GlassCard className={cn('p-6 text-center border', humanWins ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-violet-500/30 bg-violet-500/5')}>
              <Trophy className={cn('h-12 w-12 mx-auto mb-3', humanWins ? 'text-yellow-400' : 'text-violet-400')} />
              <h2 className="text-2xl font-bold mb-1">
                {humanWins ? t('You won! 🎉', 'Bạn thắng! 🎉') : t('AI wins this round', 'AI thắng vòng này')}
              </h2>
              <p className="text-muted-foreground text-sm">
                {humanWins
                  ? t('Great testing instincts! You outperformed the AI.', 'Bản năng tester tốt! Bạn vượt qua AI.')
                  : t('Keep practicing — the AI had more training data this time.', 'Tiếp tục luyện tập — AI có nhiều data hơn lần này.')}
              </p>
            </GlassCard>

            {/* Score comparison */}
            <div className="grid grid-cols-2 gap-4">
              <GlassCard className="p-5 border border-blue-500/20 bg-blue-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-blue-400" />
                  <span className="font-bold text-blue-400">{t('You', 'Bạn')}</span>
                </div>
                <div className="text-4xl font-bold text-blue-400 mb-1">{humanScore}%</div>
                <p className="text-xs text-muted-foreground">{humanBugs.length} {t('bugs reported', 'bug báo cáo')} · {humanMatches} {t('correct', 'đúng')}</p>
                <div className="mt-3 space-y-1">
                  {humanBugs.slice(0, 4).map((b, i) => (
                    <div key={i} className="text-xs text-muted-foreground truncate">• {b.title}</div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-5 border border-violet-500/20 bg-violet-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-4 w-4 text-violet-400" />
                  <span className="font-bold text-violet-400">AI</span>
                </div>
                <div className="text-4xl font-bold text-violet-400 mb-1">{aiScore}%</div>
                <p className="text-xs text-muted-foreground">6 {t('bugs found', 'bug tìm được')} in 8.2s</p>
                <div className="mt-3 space-y-1">
                  {ANSWER_KEY.slice(0, 4).map((b) => (
                    <div key={b.id} className="text-xs text-muted-foreground truncate">• {b.title}</div>
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* Full answer key */}
            <GlassCard className="p-5">
              <p className="text-sm font-bold mb-3">{t('All hidden bugs revealed', 'Tất cả bug ẩn được tiết lộ')} ({ANSWER_KEY.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ANSWER_KEY.map((b) => {
                  const humanFound = humanBugs.some((h) =>
                    b.title.toLowerCase().split(' ').some((w) => h.title.toLowerCase().includes(w))
                  )
                  return (
                    <div key={b.id} className={cn('flex items-center gap-2 rounded-lg p-2.5 text-sm', humanFound ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-muted/30')}>
                      <span className="text-base">{humanFound ? '✅' : '❌'}</span>
                      <span className="flex-1 truncate">{b.title}</span>
                      <SeverityBadge severity={b.severity} />
                    </div>
                  )
                })}
              </div>
            </GlassCard>

            <div className="flex gap-3 justify-center">
              <GlowButton onClick={() => { setPhase('intro'); setHumanBugs([]); }} variant="secondary">
                {t('Play again', 'Chơi lại')}
              </GlowButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
