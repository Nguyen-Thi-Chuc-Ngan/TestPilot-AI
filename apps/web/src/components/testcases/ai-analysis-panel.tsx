'use client'

import { X, AlertTriangle, TrendingUp, Copy, Zap, Target, Shield } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'

interface Props {
  analysis: Record<string, unknown>
  onClose: () => void
  lang: string
}

export function AIAnalysisPanel({ analysis, onClose, lang }: Props) {
  const t = (en: string, vi: string) => lang === 'vi' ? vi : en
  const score = Number(analysis.overall_quality_score ?? 0)
  const scoreColor = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500'

  const missing  = (analysis.missing_scenarios  as string[]) ?? []
  const gaps     = (analysis.coverage_gaps      as string[]) ?? []
  const recs     = (analysis.recommendations    as string[]) ?? []
  const weak     = (analysis.weak_cases         as { tc_id: string; reason: string }[]) ?? []
  const dups     = (analysis.duplicates         as { tc_ids: string[]; reason: string }[]) ?? []
  const autos    = (analysis.automation_candidates as { tc_id: string; reason: string; framework: string }[]) ?? []

  return (
    <GlassCard className="p-5 border border-violet-500/20 bg-violet-500/5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <Zap className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <p className="font-bold text-sm">{t('AI Analysis Result', 'Kết quả phân tích AI')}</p>
            <p className="text-xs text-muted-foreground">{t('Quality assessment of your test suite', 'Đánh giá chất lượng test suite')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className={`text-2xl font-black ${scoreColor}`}>{score}</div>
            <div className="text-[10px] text-muted-foreground">/100</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Missing scenarios */}
        {missing.length > 0 && (
          <div className="rounded-xl border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/5 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="h-3.5 w-3.5 text-orange-500" />
              <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">{t('Missing Scenarios', 'Thiếu kịch bản')} ({missing.length})</p>
            </div>
            <ul className="space-y-1">
              {missing.map((m, i) => <li key={i} className="text-xs text-muted-foreground">• {m}</li>)}
            </ul>
          </div>
        )}

        {/* Coverage gaps */}
        {gaps.length > 0 && (
          <div className="rounded-xl border border-yellow-200 dark:border-yellow-500/20 bg-yellow-50 dark:bg-yellow-500/5 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Shield className="h-3.5 w-3.5 text-yellow-500" />
              <p className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest">{t('Coverage Gaps', 'Thiếu coverage')} ({gaps.length})</p>
            </div>
            <ul className="space-y-1">
              {gaps.map((g, i) => <li key={i} className="text-xs text-muted-foreground">• {g}</li>)}
            </ul>
          </div>
        )}

        {/* Automation candidates */}
        {autos.length > 0 && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="h-3.5 w-3.5 text-blue-500" />
              <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{t('Automate These', 'Nên tự động hóa')} ({autos.length})</p>
            </div>
            <ul className="space-y-1">
              {autos.map((a, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  <span className="font-mono text-blue-600 dark:text-blue-400">{a.tc_id}</span> · {a.framework}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weak cases */}
        {weak.length > 0 && (
          <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">{t('Weak Cases', 'Test case yếu')} ({weak.length})</p>
            </div>
            <ul className="space-y-1">
              {weak.map((w, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  <span className="font-mono text-red-600 dark:text-red-400">{w.tc_id}</span>: {w.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Duplicates */}
        {dups.length > 0 && (
          <div className="rounded-xl border border-purple-200 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/5 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Copy className="h-3.5 w-3.5 text-purple-500" />
              <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">{t('Duplicates', 'Trùng lặp')} ({dups.length})</p>
            </div>
            <ul className="space-y-1">
              {dups.map((d, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  <span className="font-mono text-purple-600 dark:text-purple-400">{d.tc_ids.join(', ')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {recs.length > 0 && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t('Recommendations', 'Khuyến nghị')}</p>
            </div>
            <ul className="space-y-1">
              {recs.map((r, i) => <li key={i} className="text-xs text-muted-foreground">• {r}</li>)}
            </ul>
          </div>
        )}
      </div>
    </GlassCard>
  )
}
