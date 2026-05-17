'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Wand2, Languages, GraduationCap, MessageSquare, TrendingUp, Star, ChevronRight } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { useLang } from '@/stores/language-store'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { WritingFixer } from './writing-fixer'
import { VocabularyTrainer } from './vocabulary-trainer'

type Tab = 'fixer' | 'vocab' | 'history'

interface Progress {
  professionalism_avg: number
  corrections_count: number
  english_level: string
  words_learned: number
}

const LEVEL_COLOR: Record<string, string> = {
  'Beginner QA':     'text-gray-400',
  'Developing QA':   'text-yellow-500',
  'Intermediate QA': 'text-blue-500',
  'Professional QA': 'text-violet-500',
  'Senior QA Writer':'text-emerald-500',
}

const QUICK_EXAMPLES = [
  { vi: 'app bị out khi scan QR', label: 'Crash bug', context: 'bug_report' as const },
  { vi: 'dev fix chưa vậy', label: 'Slack message', context: 'slack' as const },
  { vi: 'button không bấm được', label: 'UI bug', context: 'bug_report' as const },
  { vi: 'lỗi load lâu', label: 'Performance', context: 'bug_report' as const },
]

export function EnglishDashboard() {
  const { lang } = useLang()
  const [activeTab, setActiveTab] = useState<Tab>('fixer')
  const [progress, setProgress] = useState<Progress | null>(null)
  const [quickInput, setQuickInput] = useState('')
  const [quickContext, setQuickContext] = useState<string>('bug_report')

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  useEffect(() => {
    apiClient.get<Progress>('/api/english/progress').then(setProgress).catch(() => {})
  }, [])

  const tabs = [
    { id: 'fixer' as Tab,   icon: Wand2,      label: t('Writing Fixer', 'Sửa Văn Bản') },
    { id: 'vocab' as Tab,   icon: BookOpen,   label: t('Vocabulary', 'Từ Vựng QA') },
    { id: 'history' as Tab, icon: TrendingUp, label: t('History', 'Lịch Sử') },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-violet-500" />
            {t('AI QA English Coach', 'Huấn Luyện Tiếng Anh QA')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              'Write better bug reports, communicate professionally, and build QA English skills.',
              'Viết bug report tốt hơn, giao tiếp chuyên nghiệp, và nâng cao tiếng Anh QA.'
            )}
          </p>
        </div>

        {/* Progress pill */}
        {progress && (
          <div className="flex-shrink-0 text-right">
            <p className={cn('font-bold text-sm', LEVEL_COLOR[progress.english_level] ?? 'text-muted-foreground')}>
              {progress.english_level}
            </p>
            <p className="text-xs text-muted-foreground">
              {progress.corrections_count} {t('corrections', 'lần sửa')} · avg {progress.professionalism_avg}/10
            </p>
          </div>
        )}
      </div>

      {/* Quick examples */}
      <GlassCard className="p-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
          {t('Try a quick example', 'Thử ví dụ nhanh')}
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_EXAMPLES.map((ex) => (
            <button key={ex.vi}
              onClick={() => { setQuickInput(ex.vi); setQuickContext(ex.context); setActiveTab('fixer') }}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted hover:border-violet-500/40 transition-all group">
              <span className="text-muted-foreground">{ex.label}:</span>
              <span className="text-foreground font-medium italic">&ldquo;{ex.vi}&rdquo;</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-violet-500 transition-colors" />
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative',
              activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="eng-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'fixer' && (
          <motion.div key="fixer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <WritingFixer initialText={quickInput} initialContext={quickContext} lang={lang} onCorrection={() => {
              setQuickInput('')
              apiClient.get<Progress>('/api/english/progress').then(setProgress).catch(() => {})
            }} />
          </motion.div>
        )}
        {activeTab === 'vocab' && (
          <motion.div key="vocab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <VocabularyTrainer lang={lang} />
          </motion.div>
        )}
        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <HistoryPanel lang={lang} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function HistoryPanel({ lang }: { lang: string }) {
  const [history, setHistory] = useState<Record<string, unknown>[]>([])
  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  useEffect(() => {
    apiClient.get<Record<string, unknown>[]>('/api/english/history').then(setHistory).catch(() => {})
  }, [])

  if (history.length === 0) return (
    <GlassCard className="p-12 text-center">
      <TrendingUp className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
      <p className="text-muted-foreground">{t('No corrections yet. Try the Writing Fixer!', 'Chưa có lần sửa nào. Thử Writing Fixer đi!')}</p>
    </GlassCard>
  )

  return (
    <div className="space-y-3">
      {history.map((item, i) => (
        <GlassCard key={i} className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {String(item.feature ?? '')} · {String(item.style ?? '')}
            </span>
            <span className={cn('text-xs font-bold', Number(item.professionalism_score) >= 8 ? 'text-emerald-500' : Number(item.professionalism_score) >= 6 ? 'text-yellow-500' : 'text-red-500')}>
              {String(item.professionalism_score ?? 0)}/10
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">{t('Original', 'Bản gốc')}</p>
              <p className="text-foreground/60 italic">{String(item.original_text ?? '')}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">{t('Corrected', 'Đã sửa')}</p>
              <p className="text-foreground/90">{String(item.corrected_text ?? '')}</p>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  )
}
