'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, Copy, Check, Loader2, ChevronDown, BookOpen, MessageSquare, Star } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FixResult {
  original: string
  rewritten: string
  professionalism_score: number
  improvements: string[]
  vocabulary_tips: { word: string; meaning: string; example: string }[]
  grammar_notes: string
  tone_note: string
}

const STYLES = ['Simple', 'Professional QA', 'Corporate Jira', 'Senior QA'] as const
const CONTEXTS = [
  { id: 'bug_report', label: 'Bug Report' },
  { id: 'testcase',   label: 'Test Case' },
  { id: 'comment',    label: 'Jira Comment' },
  { id: 'slack',      label: 'Slack Message' },
  { id: 'meeting',    label: 'Meeting Note' },
] as const

interface Props {
  initialText?: string
  initialContext?: string
  lang: string
  onCorrection?: () => void
}

export function WritingFixer({ initialText = '', initialContext = 'bug_report', lang, onCorrection }: Props) {
  const [input, setInput]     = useState(initialText)
  const [style, setStyle]     = useState<string>('Professional QA')
  const [context, setContext] = useState(initialContext)
  const [result, setResult]   = useState<FixResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)
  const [showTips, setShowTips] = useState(false)

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  // Update when quick example selected
  useEffect(() => { if (initialText) setInput(initialText) }, [initialText])
  useEffect(() => { if (initialContext) setContext(initialContext) }, [initialContext])

  async function fix() {
    if (!input.trim()) { toast.error(t('Please enter some text', 'Vui lòng nhập văn bản')); return }
    setLoading(true)
    setResult(null)
    try {
      const data = await apiClient.post<FixResult>('/api/english/fix', {
        text: input, style, feature: 'fixer', context,
      })
      setResult(data)
      onCorrection?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('AI failed', 'AI gặp lỗi'))
    } finally { setLoading(false) }
  }

  function copyResult() {
    if (!result) return
    navigator.clipboard.writeText(result.rewritten)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success(t('Copied!', 'Đã sao chép!'))
  }

  const scoreColor = result
    ? result.professionalism_score >= 8 ? 'text-emerald-500'
    : result.professionalism_score >= 6 ? 'text-yellow-500' : 'text-red-500'
    : ''

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 flex-wrap">
          {CONTEXTS.map((c) => (
            <button key={c.id} onClick={() => setContext(c.id)}
              className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                context === c.id ? 'bg-violet-600 text-white border-violet-500' : 'border-border text-muted-foreground hover:bg-muted')}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          {STYLES.map((s) => (
            <button key={s} onClick={() => setStyle(s)}
              className={cn('rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all',
                style === s ? 'bg-blue-600 text-white border-blue-500' : 'border-border text-muted-foreground hover:bg-muted')}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {t('Your text (English or Vietnamese)', 'Văn bản của bạn (tiếng Anh hoặc tiếng Việt)')}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.ctrlKey && e.key === 'Enter' && fix()}
            rows={6}
            placeholder={t(
              'Enter your bug report, test case, comment... (Ctrl+Enter to fix)',
              'Nhập bug report, test case, comment... (Ctrl+Enter để sửa)'
            )}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none font-mono leading-relaxed"
          />
          <GlowButton onClick={fix} loading={loading} className="w-full" icon={<Wand2 className="h-4 w-4" />}>
            {t('Fix & Improve', 'Sửa & Cải thiện')}
          </GlowButton>
        </div>

        {/* Result */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {t('Professional Version', 'Bản Chuyên Nghiệp')}
            </label>
            {result && (
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-bold', scoreColor)}>
                  {result.professionalism_score}/10
                </span>
                <button onClick={copyResult}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {t('Copy', 'Sao chép')}
                </button>
              </div>
            )}
          </div>

          <div className={cn('rounded-xl border min-h-[156px] px-4 py-3 text-sm leading-relaxed',
            result ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground' : 'border-dashed border-border bg-muted/20 text-muted-foreground/40')}>
            {loading ? (
              <div className="flex items-center gap-2 h-full">
                <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                <span className="text-sm text-muted-foreground">
                  {t('AI is improving your writing...', 'AI đang cải thiện văn bản của bạn...')}
                </span>
              </div>
            ) : result ? (
              <p className="whitespace-pre-line">{result.rewritten}</p>
            ) : (
              <p className="text-center mt-8">{t('Your improved text will appear here', 'Văn bản đã cải thiện sẽ hiển thị ở đây')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Analysis panels */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Improvements */}
            {result.improvements?.length > 0 && (
              <GlassCard className="p-4">
                <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-3">
                  ✏️ {t('What was improved', 'Những gì đã được cải thiện')}
                </p>
                <ul className="space-y-1.5">
                  {result.improvements.map((imp, i) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground/80">
                      <span className="text-violet-400 flex-shrink-0">→</span>
                      {imp}
                    </li>
                  ))}
                </ul>
                {result.grammar_notes && (
                  <div className="mt-3 rounded-lg bg-muted/30 p-3">
                    <p className="text-xs font-bold text-muted-foreground mb-1">📐 Grammar</p>
                    <p className="text-sm text-foreground/70">{result.grammar_notes}</p>
                  </div>
                )}
                {result.tone_note && (
                  <div className="mt-2 rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                    <p className="text-xs font-bold text-blue-500 mb-1">🎯 {t('Tone', 'Giọng văn')}</p>
                    <p className="text-sm text-foreground/70">{result.tone_note}</p>
                  </div>
                )}
              </GlassCard>
            )}

            {/* Vocabulary tips */}
            {result.vocabulary_tips?.length > 0 && (
              <GlassCard className="overflow-hidden">
                <button
                  onClick={() => setShowTips(!showTips)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest">
                    📚 {t('Vocabulary Tips', 'Mẹo từ vựng')} ({result.vocabulary_tips.length})
                  </p>
                  <motion.div animate={{ rotate: showTips ? 180 : 0 }}>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {showTips && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                        {result.vocabulary_tips.map((tip, i) => (
                          <div key={i} className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3">
                            <p className="font-bold text-sm text-yellow-500">{tip.word}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{tip.meaning}</p>
                            <p className="text-xs text-foreground/70 italic mt-1">&ldquo;{tip.example}&rdquo;</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
