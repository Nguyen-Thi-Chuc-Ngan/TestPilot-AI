'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Timer, CheckCircle2, XCircle, Zap, Brain, ChevronRight, RotateCcw } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { useLang } from '@/stores/language-store'
import { cn } from '@/lib/utils'

interface Scenario {
  id: string
  title: string
  title_vi: string
  description: string
  description_vi: string
  context: string
  context_vi: string
  urgency: 'critical' | 'high' | 'medium'
  timeLimit: number
}

interface Answer {
  severity: string
  priority: string
  bugTitle: string
  stepsToReproduce: string
  nextAction: string
}

const SCENARIOS: Scenario[] = [
  {
    id: 's1',
    title: '🚨 Checkout is broken in production',
    title_vi: '🚨 Checkout bị hỏng trên production',
    description: 'Users are reporting they cannot complete purchases. The "Pay Now" button appears but nothing happens when clicked. Revenue is dropping at $2,000/minute.',
    description_vi: 'User báo cáo không thể hoàn tất mua hàng. Nút "Thanh toán" hiện ra nhưng không làm gì khi bấm. Doanh thu đang giảm $2,000/phút.',
    context: 'Last deploy: 35 minutes ago. Affected: 100% of users. Browser console shows: TypeError: Cannot read property "submit" of undefined',
    context_vi: 'Deploy cuối: 35 phút trước. Ảnh hưởng: 100% user. Console: TypeError: Cannot read property "submit" of undefined',
    urgency: 'critical',
    timeLimit: 300,
  },
  {
    id: 's2',
    title: '⚠️ Login fails for 15% of users',
    title_vi: '⚠️ Đăng nhập lỗi cho 15% user',
    description: 'Support is flooded with tickets — users with special characters in email (@+, dots) cannot log in. Error: "Invalid credentials" even with correct password.',
    description_vi: 'Support bị ngập ticket — user có ký tự đặc biệt trong email không đăng nhập được. Lỗi: "Sai thông tin" dù mật khẩu đúng.',
    context: 'Auth service deployed 2 hours ago. Normal users unaffected. Affects 15% of user base (~50K users).',
    context_vi: 'Auth service deploy 2 giờ trước. User bình thường không ảnh hưởng. Ảnh hưởng 15% user base (~50K người).',
    urgency: 'high',
    timeLimit: 300,
  },
  {
    id: 's3',
    title: '🐛 Dashboard shows wrong data',
    title_vi: '🐛 Dashboard hiển thị sai dữ liệu',
    description: 'The analytics dashboard is showing metrics from last month for all users. Sales figures look inflated. Stakeholders are making decisions based on incorrect data.',
    description_vi: 'Dashboard analytics hiển thị số liệu từ tháng trước. Số bán hàng bị thổi phồng. Stakeholder đang ra quyết định dựa trên dữ liệu sai.',
    context: 'Database migration ran at 02:00 AM. No errors in logs. Cache invalidation may not have triggered.',
    context_vi: 'Migration database chạy lúc 02:00 sáng. Không có lỗi trong log. Cache invalidation có thể không được trigger.',
    urgency: 'high',
    timeLimit: 300,
  },
]

const SEVERITY_OPTIONS = ['critical', 'high', 'medium', 'low']
const PRIORITY_OPTIONS  = ['P1 - Fix immediately', 'P2 - Fix today', 'P3 - Fix this week', 'P4 - Nice to have']
const NEXT_ACTIONS = [
  'Roll back the last deployment immediately',
  'Hotfix and redeploy with fix',
  'Disable the affected feature flag',
  'Notify users via status page',
  'Escalate to engineering lead',
  'Investigate logs before acting',
]

interface FeedbackResult {
  score: number
  strengths: string[]
  improvements: string[]
  ideal_approach: string
}

export function PanicSimulator() {
  const { lang } = useLang()
  const [phase, setPhase] = useState<'select' | 'active' | 'submitting' | 'results'>('select')
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [answer, setAnswer] = useState<Answer>({ severity: '', priority: '', bugTitle: '', stepsToReproduce: '', nextAction: '' })
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null)

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  function selectScenario(s: Scenario) {
    setScenario(s)
    setAnswer({ severity: '', priority: '', bugTitle: '', stepsToReproduce: '', nextAction: '' })
    setPhase('active')
  }

  async function submitAnswer() {
    if (!answer.severity || !answer.bugTitle || !answer.nextAction) {
      toast.error(t('Please fill severity, bug title and next action.', 'Vui lòng điền severity, tiêu đề bug và hành động tiếp theo.'))
      return
    }
    setPhase('submitting')
    try {
      const result = await apiClient.post<FeedbackResult>('/api/interview/evaluate', {
        question_id: 'panic-' + scenario?.id,
        question: `Production incident: ${scenario?.title}. Context: ${scenario?.context}`,
        answer: `Severity: ${answer.severity}. Priority: ${answer.priority}. Bug title: ${answer.bugTitle}. Steps: ${answer.stepsToReproduce}. Next action: ${answer.nextAction}`,
        level: 'mid',
      })
      setFeedback(result)
      setPhase('results')
    } catch {
      // Fallback local scoring
      const score = [answer.severity === 'critical', answer.priority.startsWith('P1'), answer.nextAction.includes('Roll back'), answer.stepsToReproduce.length > 20].filter(Boolean).length * 25
      setFeedback({
        score: Math.min(100, score + 10),
        strengths: answer.severity === scenario?.urgency ? ['Correctly identified severity'] : [],
        improvements: ['Include exact reproduction steps', 'Mention user impact count', 'Specify rollback plan'],
        ideal_approach: 'For P1 production incidents: 1) Assess blast radius, 2) Roll back if possible, 3) Notify stakeholders, 4) Write postmortem.',
      })
      setPhase('results')
    }
  }

  const urgencyColor = { critical: 'border-red-500/40 bg-red-500/8', high: 'border-orange-500/40 bg-orange-500/8', medium: 'border-yellow-500/40 bg-yellow-500/8' }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('Production Panic Simulator', 'Mô Phỏng Khủng Hoảng Production')}</h1>
          <p className="text-sm text-muted-foreground">{t('Real-world incident triage training. Choose a scenario, react fast.', 'Luyện tập xử lý sự cố thực tế. Chọn tình huống, phản ứng nhanh.')}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'select' && (
          <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('Choose an incident to triage:', 'Chọn sự cố để xử lý:')}</p>
            {SCENARIOS.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                <GlassCard hover onClick={() => selectScenario(s)} className={cn('p-5 cursor-pointer border', urgencyColor[s.urgency])}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <SeverityBadge severity={s.urgency} />
                        <h3 className="font-bold text-sm">{lang === 'vi' ? s.title_vi : s.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {lang === 'vi' ? s.description_vi : s.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}

        {phase === 'active' && scenario && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* Incident banner */}
            <div className={cn('rounded-xl border p-4', urgencyColor[scenario.urgency])}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-bold">{lang === 'vi' ? scenario.title_vi : scenario.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{lang === 'vi' ? scenario.description_vi : scenario.description}</p>
                  <div className="mt-3 rounded-lg bg-black/20 dark:bg-black/40 border border-white/10 p-3">
                    <p className="text-xs font-mono text-muted-foreground">{lang === 'vi' ? scenario.context_vi : scenario.context}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Answer form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Severity</label>
                <div className="grid grid-cols-2 gap-2">
                  {SEVERITY_OPTIONS.map((s) => (
                    <button key={s} onClick={() => setAnswer((a) => ({ ...a, severity: s }))}
                      className={cn('rounded-lg border px-3 py-2 text-xs font-medium transition-all', answer.severity === s ? 'border-violet-500 bg-violet-500/15 text-violet-300' : 'border-border bg-card text-muted-foreground hover:bg-muted')}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Priority</label>
                <div className="space-y-1.5">
                  {PRIORITY_OPTIONS.map((p) => (
                    <button key={p} onClick={() => setAnswer((a) => ({ ...a, priority: p }))}
                      className={cn('w-full rounded-lg border px-3 py-1.5 text-xs text-left transition-all', answer.priority === p ? 'border-violet-500 bg-violet-500/15 text-violet-300' : 'border-border bg-card text-muted-foreground hover:bg-muted')}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Bug Title</label>
              <input value={answer.bugTitle} onChange={(e) => setAnswer((a) => ({ ...a, bugTitle: e.target.value }))}
                placeholder={t('Write a clear, concise bug title...', 'Viết tiêu đề bug rõ ràng, ngắn gọn...')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50" />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Steps to Reproduce / Evidence</label>
              <textarea value={answer.stepsToReproduce} onChange={(e) => setAnswer((a) => ({ ...a, stepsToReproduce: e.target.value }))}
                rows={3} placeholder={t('1. Go to checkout\n2. Click Pay Now\n3. Nothing happens', '1. Vào checkout\n2. Bấm Thanh toán\n3. Không có gì xảy ra')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none font-mono" />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Immediate Next Action</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {NEXT_ACTIONS.map((a) => (
                  <button key={a} onClick={() => setAnswer((ans) => ({ ...ans, nextAction: a }))}
                    className={cn('rounded-lg border px-3 py-2 text-xs text-left transition-all', answer.nextAction === a ? 'border-violet-500 bg-violet-500/15 text-violet-300' : 'border-border bg-card text-muted-foreground hover:bg-muted')}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <GlowButton onClick={submitAnswer} icon={<Zap className="h-4 w-4" />} className="flex-1">
                {t('Submit Triage', 'Nộp Bài')}
              </GlowButton>
              <GlowButton variant="ghost" onClick={() => setPhase('select')}>
                {t('Back', 'Quay lại')}
              </GlowButton>
            </div>
          </motion.div>
        )}

        {phase === 'submitting' && (
          <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center space-y-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="h-16 w-16 rounded-full border-4 border-violet-500/30 border-t-violet-400 mx-auto" />
            <div>
              <p className="font-bold text-violet-400">AI is evaluating your triage...</p>
              <p className="text-sm text-muted-foreground mt-1">Comparing with senior QA best practices</p>
            </div>
          </motion.div>
        )}

        {phase === 'results' && feedback && (
          <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Score */}
            <GlassCard className="p-6 text-center">
              <div className={cn('text-6xl font-black mb-2', feedback.score >= 75 ? 'text-emerald-400' : feedback.score >= 50 ? 'text-yellow-400' : 'text-red-400')}>
                {feedback.score}
              </div>
              <p className="text-muted-foreground">{feedback.score >= 75 ? t('Excellent triage! 🎉', 'Triage xuất sắc! 🎉') : feedback.score >= 50 ? t('Good effort, room to improve', 'Khá tốt, còn có thể cải thiện') : t('Keep practicing — triage is a skill', 'Tiếp tục luyện — triage là kỹ năng')}</p>
            </GlassCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {feedback.strengths.length > 0 && (
                <GlassCard className="p-4 border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">{t('Strengths', 'Điểm mạnh')}</p>
                  <ul className="space-y-1">
                    {feedback.strengths.map((s, i) => <li key={i} className="text-sm flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5"/>{s}</li>)}
                  </ul>
                </GlassCard>
              )}
              <GlassCard className="p-4 border border-orange-500/20 bg-orange-500/5">
                <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2">{t('Improvements', 'Cần cải thiện')}</p>
                <ul className="space-y-1">
                  {feedback.improvements.map((s, i) => <li key={i} className="text-sm flex gap-2"><XCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5"/>{s}</li>)}
                </ul>
              </GlassCard>
            </div>

            <GlassCard className="p-4 border border-blue-500/20 bg-blue-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-blue-400" />
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{t('Ideal Approach', 'Cách xử lý lý tưởng')}</p>
              </div>
              <p className="text-sm text-muted-foreground">{feedback.ideal_approach}</p>
            </GlassCard>

            <div className="flex gap-3 justify-center">
              <GlowButton onClick={() => setPhase('select')} icon={<RotateCcw className="h-4 w-4" />} variant="secondary">
                {t('Try another scenario', 'Thử tình huống khác')}
              </GlowButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
