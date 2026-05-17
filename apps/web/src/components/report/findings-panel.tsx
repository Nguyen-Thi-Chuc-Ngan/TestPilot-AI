'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, CheckCircle2 } from 'lucide-react'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { GlassCard } from '@/components/ui/glass-card'

interface Finding {
  id: string
  category: string
  title: string
  description: string
  severity: string
  element_hint?: string
  recommendation?: string
  roast_comment?: string
}

const categoryColor: Record<string, string> = {
  layout:       'text-blue-400 bg-blue-500/10 border-blue-500/20',
  typography:   'text-purple-400 bg-purple-500/10 border-purple-500/20',
  color:        'text-pink-400 bg-pink-500/10 border-pink-500/20',
  accessibility:'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  usability:    'text-orange-400 bg-orange-500/10 border-orange-500/20',
  content:      'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
}

const severityOrder = ['critical', 'high', 'medium', 'low', 'info']

export function FindingsPanel({ findings }: { findings: Record<string, unknown>[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const typed = findings as unknown as Finding[]
  const sorted = [...typed].sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity))

  if (sorted.length === 0) {
    return (
      <GlassCard className="p-16 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-400/40 mx-auto mb-4" />
        <p className="font-medium text-white/50">No findings — this page looks clean!</p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-2">
      {sorted.map((f, i) => {
        const isOpen = expanded === f.id
        const catCls = categoryColor[f.category] ?? 'text-white/50 bg-white/5 border-white/10'
        return (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <GlassCard className="overflow-hidden">
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpanded(isOpen ? null : f.id)}
              >
                <SeverityBadge severity={f.severity} />
                <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-medium ${catCls}`}>
                  {f.category}
                </span>
                <span className="flex-1 text-sm font-medium truncate">{f.title}</span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
                      {f.description
                        ? <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                        : <p className="text-sm text-muted-foreground/40 italic">No description provided.</p>
                      }

                      {f.element_hint && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-muted-foreground/50 font-mono mt-0.5 flex-shrink-0">WHERE</span>
                          <span className="text-xs text-muted-foreground font-mono">{f.element_hint}</span>
                        </div>
                      )}

                      {f.recommendation && (
                        <div className="rounded-lg border border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/5 p-3">
                          <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1">Fix</p>
                          <p className="text-sm text-foreground/70">{f.recommendation}</p>
                        </div>
                      )}

                      {f.roast_comment && (
                        <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                          <p className="text-xs font-bold text-orange-400 mb-1">🔥 Roast</p>
                          <p className="text-sm text-orange-300/80 italic">&ldquo;{f.roast_comment}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        )
      })}
    </div>
  )
}
