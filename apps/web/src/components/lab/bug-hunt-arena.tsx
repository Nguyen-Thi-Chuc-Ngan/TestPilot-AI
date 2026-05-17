'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bug, Timer, Plus, Trophy, ChevronRight, Shuffle, RefreshCw, X, Beaker } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { useLang } from '@/stores/language-store'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  generateChallenge, scoreChallenge,
  AVAILABLE_TEMPLATES, DIFFICULTIES,
  type Difficulty, type TemplateId, type PlayerReport, type GeneratedChallenge,
  type BugCategory, type BugSeverity,
} from '@/lib/lab/bug-engine'

type Phase = 'howto' | 'setup' | 'playing' | 'results'

const CATEGORIES: BugCategory[] = ['ui', 'validation', 'logic', 'accessibility', 'performance', 'security']
const SEVERITIES: BugSeverity[] = ['Critical', 'Major', 'Minor', 'Trivial']

const GRADE_CONFIG = {
  S: { color: 'text-yellow-400', label: 'S — Perfect!',      bg: 'bg-yellow-500/10 border-yellow-500/30' },
  A: { color: 'text-emerald-400',label: 'A — Great!',        bg: 'bg-emerald-500/10 border-emerald-500/30' },
  B: { color: 'text-blue-400',   label: 'B — Good',          bg: 'bg-blue-500/10 border-blue-500/30' },
  C: { color: 'text-yellow-500', label: 'C — Average',       bg: 'bg-yellow-500/10 border-yellow-500/30' },
  F: { color: 'text-red-400',    label: 'F — Keep trying',   bg: 'bg-red-500/10 border-red-500/30' },
}

export function BugHuntArena() {
  const { lang } = useLang()
  const [phase, setPhase]         = useState<Phase>('howto')
  const [templateId, setTemplateId] = useState<TemplateId>('login')
  const [difficulty, setDifficulty] = useState<Difficulty>('Junior QA')
  const [challenge, setChallenge] = useState<GeneratedChallenge | null>(null)
  const [reports, setReports]     = useState<PlayerReport[]>([])
  const [newReport, setNewReport] = useState({ title: '', description: '', severity: 'Minor' as BugSeverity, category: 'ui' as BugCategory })
  const [timeLeft, setTimeLeft]   = useState(0)
  const [result, setResult]       = useState<ReturnType<typeof scoreChallenge> | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()
  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  function startChallenge() {
    const c = generateChallenge(templateId, difficulty)
    setChallenge(c)
    setReports([])
    setTimeLeft(c.timeLimit)
    setPhase('playing')
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); endChallenge(c); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  function endChallenge(c?: GeneratedChallenge) {
    clearInterval(timerRef.current!)
    const active = c ?? challenge
    if (!active) return
    const scoring = scoreChallenge(active, reports)
    setResult(scoring)
    setPhase('results')
    saveResult(active, scoring)
  }

  async function saveResult(c: GeneratedChallenge, scoring: ReturnType<typeof scoreChallenge>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('challenge_runs').insert({
      user_id: user.id, mode: 'bug_hunt',
      template_id: c.templateId, difficulty: c.difficulty,
      injected_bugs: c.bugs, found_bugs: reports,
      score: scoring.score, max_score: scoring.maxScore,
      time_taken: c.timeLimit - timeLeft,
      ai_feedback: scoring.feedback, completed: true,
    })
    // Update player progress
    const { data: prog } = await supabase.from('player_progress').select('*').eq('user_id', user.id).single()
    const xpGain = Math.round((scoring.percentage / 100) * c.xpReward)
    if (prog) {
      await supabase.from('player_progress').update({
        total_xp: prog.total_xp + xpGain,
        runs_completed: prog.runs_completed + 1,
        bugs_found: prog.bugs_found + scoring.matchedBugIds.length,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id)
    } else {
      await supabase.from('player_progress').insert({ user_id: user.id, total_xp: xpGain, runs_completed: 1, bugs_found: scoring.matchedBugIds.length })
    }
  }

  function addReport() {
    if (!newReport.title.trim()) return
    setReports((prev) => [...prev, { ...newReport }])
    setNewReport({ title: '', description: '', severity: 'Minor', category: 'ui' })
  }

  useEffect(() => () => clearInterval(timerRef.current!), [])

  const timerPct = challenge ? (timeLeft / challenge.timeLimit) * 100 : 100
  const timerColor = timeLeft > 60 ? 'bg-emerald-500' : timeLeft > 20 ? 'bg-yellow-500' : 'bg-red-500'
  const iframeUrl = challenge ? `/lab/templates/${challenge.templateId}.html?bugs=${challenge.hiddenBugIds.join(',')}` : ''

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bug className="h-6 w-6 text-red-500" />
            {t('Bug Hunt', 'Săn Bug')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Find bugs before time runs out. Each run is unique.', 'Tìm bug trước khi hết giờ. Mỗi lượt chơi là khác nhau.')}
          </p>
        </div>
        {phase !== 'setup' && (
          <GlowButton variant="ghost" onClick={() => { clearInterval(timerRef.current!); setPhase('setup') }} icon={<X className="h-4 w-4" />}>
            {t('Quit', 'Thoát')}
          </GlowButton>
        )}
      </div>

      {/* HOW TO PLAY */}
        {phase === 'howto' && (
          <motion.div key="howto" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <GlassCard className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <Bug className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">{t('How to Play Bug Hunt', 'Cách Chơi Săn Bug')}</h2>
                  <p className="text-sm text-muted-foreground">{t('Read carefully before starting', 'Đọc kỹ trước khi bắt đầu')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    step: '01',
                    title: t('Choose template & difficulty', 'Chọn template & độ khó'),
                    desc: t(
                      'Pick a fake app to test (Login, Checkout, Dashboard...) and your difficulty level. Higher difficulty = more bugs, less time.',
                      'Chọn app giả để test (Login, Checkout, Dashboard...) và độ khó. Khó hơn = nhiều bug hơn, ít thời gian hơn.'
                    ),
                    color: 'border-violet-500/30 bg-violet-500/5',
                    num: 'text-violet-400',
                  },
                  {
                    step: '02',
                    title: t('Explore the page', 'Khám phá trang'),
                    desc: t(
                      'The app on the left has hidden bugs injected. Click around, try inputs, resize the window, check the UI carefully.',
                      'App bên trái có bug ẩn được chèn vào. Click xung quanh, thử các input, resize cửa sổ, quan sát UI kỹ.'
                    ),
                    color: 'border-blue-500/30 bg-blue-500/5',
                    num: 'text-blue-400',
                  },
                  {
                    step: '03',
                    title: t('Report bugs you find', 'Báo bug tìm được'),
                    desc: t(
                      'When you spot a bug, type its title in the reporter on the right. Choose the correct Category (ui/validation/logic...) and Severity (Critical/Major/Minor/Trivial).',
                      'Khi phát hiện bug, nhập tên bug vào ô bên phải. Chọn đúng Category (ui/validation/logic...) và Severity (Critical/Major/Minor/Trivial).'
                    ),
                    color: 'border-emerald-500/30 bg-emerald-500/5',
                    num: 'text-emerald-400',
                  },
                  {
                    step: '04',
                    title: t('Submit before time runs out', 'Nộp trước khi hết giờ'),
                    desc: t(
                      'Click Submit when done or wait for the timer. AI compares your reports to the hidden bug list and scores you. Grade: S > A > B > C > F.',
                      'Bấm Nộp bài khi xong hoặc chờ hết giờ. AI so sánh report của bạn với danh sách bug ẩn và chấm điểm. Thang: S > A > B > C > F.'
                    ),
                    color: 'border-yellow-500/30 bg-yellow-500/5',
                    num: 'text-yellow-400',
                  },
                ].map((item) => (
                  <div key={item.step} className={cn('rounded-xl border p-4 space-y-2', item.color)}>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-2xl font-black', item.num)}>{item.step}</span>
                      <p className="font-semibold text-sm">{item.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Scoring tip */}
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('Scoring Tips', 'Mẹo tính điểm')}</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• {t('Finding the bug = 70 pts', 'Tìm được bug = 70 điểm')}</li>
                  <li>• {t('Correct severity = +20 pts bonus', 'Chọn đúng severity = +20 điểm thưởng')}</li>
                  <li>• {t('Correct category = +10 pts bonus', 'Chọn đúng category = +10 điểm thưởng')}</li>
                  <li>• {t('Bug title must match — be specific!', 'Tên bug phải khớp — viết rõ ràng!')}</li>
                  <li>• {t('Not all bugs need to be found — focus on severity', 'Không cần tìm hết bug — ưu tiên theo severity')}</li>
                </ul>
              </div>
            </GlassCard>

            <div className="flex justify-center">
              <GlowButton onClick={() => setPhase('setup')} size="lg" icon={<ChevronRight className="h-5 w-5" />}>
                {t('Got it, let me choose a challenge', 'Hiểu rồi, cho tôi chọn thử thách')}
              </GlowButton>
            </div>
          </motion.div>
        )}

      {/* SETUP */}
      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            <GlassCard className="p-5 space-y-5">
              {/* Template picker */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                  {t('Challenge Template', 'Template')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_TEMPLATES.map((tmpl) => (
                    <button key={tmpl.id} onClick={() => setTemplateId(tmpl.id as TemplateId)}
                      className={cn('rounded-xl border p-3 text-left transition-all', templateId === tmpl.id ? 'border-violet-500/50 bg-violet-500/10 text-violet-300' : 'border-border hover:bg-muted/50 text-muted-foreground')}>
                      <p className="text-sm font-semibold">{tmpl.name}</p>
                      <p className="text-[10px] mt-0.5 opacity-70">{tmpl.allBugs.length} possible bugs</p>
                    </button>
                  ))}
                  <button onClick={() => setTemplateId(AVAILABLE_TEMPLATES[Math.floor(Math.random() * AVAILABLE_TEMPLATES.length)].id as TemplateId)}
                    className="rounded-xl border border-dashed border-border p-3 text-muted-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-2">
                    <Shuffle className="h-4 w-4" />
                    <span className="text-xs">{t('Random', 'Ngẫu nhiên')}</span>
                  </button>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                  {t('Difficulty', 'Độ khó')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button key={d} onClick={() => setDifficulty(d)}
                      className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium transition-all', difficulty === d ? 'bg-violet-600 text-white border-violet-500' : 'border-border text-muted-foreground hover:bg-muted')}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard>

            <div className="flex justify-center">
              <GlowButton onClick={startChallenge} size="lg" icon={<Bug className="h-5 w-5" />}>
                {t('Start Bug Hunt!', 'Bắt Đầu!')}
              </GlowButton>
            </div>
          </motion.div>
        )}

        {/* PLAYING */}
        {phase === 'playing' && challenge && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Timer */}
            <GlassCard className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{challenge.difficulty} · {challenge.templateId}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('text-2xl font-bold font-mono', timeLeft <= 20 ? 'text-red-500 animate-pulse' : 'text-foreground')}>
                    {String(Math.floor(timeLeft/60)).padStart(2,'0')}:{String(timeLeft%60).padStart(2,'0')}
                  </span>
                  <GlowButton size="sm" variant="secondary" onClick={() => endChallenge()}>
                    {t('Submit', 'Nộp bài')}
                  </GlowButton>
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div className={cn('h-full rounded-full transition-colors', timerColor)} style={{ width: `${timerPct}%` }} />
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Template iframe */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 border-b border-border">
                  <div className="flex gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-red-400"/><div className="h-2.5 w-2.5 rounded-full bg-yellow-400"/><div className="h-2.5 w-2.5 rounded-full bg-green-400"/></div>
                  <span className="text-xs text-muted-foreground font-mono">{challenge.templateId} — find the bugs!</span>
                </div>
                <iframe src={iframeUrl} className="w-full h-80 bg-white" title="Bug Hunt Template" />
              </div>

              {/* Bug reporter */}
              <div className="space-y-3">
                <GlassCard className="p-4 space-y-3">
                  <p className="text-sm font-bold">{t('Report a bug', 'Báo bug')}</p>
                  <input value={newReport.title} onChange={(e) => setNewReport((r) => ({ ...r, title: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addReport()}
                    placeholder={t('Bug title (Enter to add)', 'Tên bug (Enter để thêm)')}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={newReport.category} onChange={(e) => setNewReport((r) => ({ ...r, category: e.target.value as BugCategory }))}
                      className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:outline-none">
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <select value={newReport.severity} onChange={(e) => setNewReport((r) => ({ ...r, severity: e.target.value as BugSeverity }))}
                      className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground focus:outline-none">
                      {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <GlowButton onClick={addReport} disabled={!newReport.title.trim()} className="w-full" icon={<Plus className="h-4 w-4" />}>
                    {t('Add report', 'Thêm report')}
                  </GlowButton>
                </GlassCard>

                {reports.length > 0 && (
                  <GlassCard className="p-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                      {t('Your reports', 'Reports của bạn')} ({reports.length})
                    </p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {reports.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="rounded bg-red-500/10 text-red-400 px-1.5 py-0.5 font-bold flex-shrink-0">{r.severity}</span>
                          <span className="text-foreground truncate">{r.title}</span>
                          <button onClick={() => setReports((prev) => prev.filter((_, j) => j !== i))}
                            className="ml-auto text-muted-foreground/40 hover:text-red-500 transition-colors flex-shrink-0">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* RESULTS */}
        {phase === 'results' && result && challenge && (
          <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Grade card */}
            {(() => {
              const gcfg = GRADE_CONFIG[result.grade]
              return (
                <GlassCard className={cn('p-6 text-center border', gcfg.bg)}>
                  <p className={cn('text-6xl font-black mb-2', gcfg.color)}>{result.grade}</p>
                  <p className="text-lg font-bold">{gcfg.label}</p>
                  <p className="text-3xl font-bold mt-2">{result.score}<span className="text-muted-foreground text-lg">/{result.maxScore}</span></p>
                  <p className="text-sm text-muted-foreground mt-1">{result.percentage}% accuracy</p>
                  <p className="text-sm mt-3 max-w-md mx-auto text-foreground/80">{result.feedback}</p>
                </GlassCard>
              )
            })()}

            {/* Bug comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassCard className="p-4">
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3">
                  ✓ {t('Found', 'Tìm được')} ({result.matchedBugIds.length}/{challenge.bugs.length})
                </p>
                <div className="space-y-2">
                  {challenge.bugs.filter((b) => result.matchedBugIds.includes(b.id)).map((b) => (
                    <div key={b.id} className="text-xs text-foreground/80 flex gap-2">
                      <span className="text-emerald-500 flex-shrink-0">✓</span>{b.title}
                    </div>
                  ))}
                  {result.matchedBugIds.length === 0 && <p className="text-xs text-muted-foreground">None found</p>}
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3">
                  ✗ {t('Missed', 'Bỏ sót')} ({result.missedBugs.length})
                </p>
                <div className="space-y-2">
                  {result.missedBugs.map((b) => (
                    <div key={b.id} className="text-xs space-y-0.5">
                      <p className="text-foreground/80 flex gap-2"><span className="text-red-400">✗</span>{b.title}</p>
                      {b.hint && <p className="text-muted-foreground ml-4">💡 {b.hint}</p>}
                    </div>
                  ))}
                  {result.missedBugs.length === 0 && <p className="text-xs text-emerald-500 font-bold">All found! Perfect! 🎉</p>}
                </div>
              </GlassCard>
            </div>

            <div className="flex gap-3 justify-center">
              <GlowButton onClick={() => { setPhase('setup'); setChallenge(null); setResult(null) }} icon={<RefreshCw className="h-4 w-4" />}>
                {t('Play again', 'Chơi lại')}
              </GlowButton>
              <GlowButton variant="secondary" onClick={() => { const c = generateChallenge(templateId, difficulty); setChallenge(c); setReports([]); setTimeLeft(c.timeLimit); setResult(null); setPhase('playing') }} icon={<Shuffle className="h-4 w-4" />}>
                {t('New challenge', 'Thử thách mới')}
              </GlowButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
