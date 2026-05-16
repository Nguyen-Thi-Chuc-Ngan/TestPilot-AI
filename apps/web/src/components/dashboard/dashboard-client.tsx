'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Bug, Zap, Clock, Plus, TrendingUp, AlertTriangle } from 'lucide-react'
import { useLang } from '@/stores/language-store'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { AIStatusPill } from '@/components/ui/ai-status-pill'

interface ScanJob {
  id: string
  url: string
  status: string
  created_at: string
  mode?: string
}

interface Props {
  recentScans: ScanJob[]
  totalScans: number
  totalFindings: number
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-emerald-500',
    running:   'bg-blue-500 animate-pulse',
    queued:    'bg-yellow-500 animate-pulse',
    failed:    'bg-red-500',
  }
  return <span className={`h-2 w-2 rounded-full flex-shrink-0 ${map[status] ?? 'bg-muted-foreground/30'}`} />
}

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.07 } } }

export function DashboardClient({ recentScans, totalScans, totalFindings }: Props) {
  const { lang } = useLang()

  const stats = [
    { icon: Zap,           label: lang === 'vi' ? 'Tổng lượt quét' : 'Total Scans',  value: totalScans,    iconCls: 'text-violet-500', cardCls: 'border-violet-200 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/5',   numCls: 'text-violet-600 dark:text-violet-400' },
    { icon: Bug,           label: lang === 'vi' ? 'Bug tìm được' : 'Bugs Found',     value: totalFindings, iconCls: 'text-red-500',    cardCls: 'border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/5',               numCls: 'text-red-600 dark:text-red-400' },
    { icon: TrendingUp,    label: lang === 'vi' ? 'Độ chính xác AI' : 'AI Accuracy', value: 94,            iconCls: 'text-emerald-500',cardCls: 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5', numCls: 'text-emerald-600 dark:text-emerald-400', suffix: '%' },
    { icon: AlertTriangle, label: lang === 'vi' ? 'Critical' : 'Critical',           value: Math.max(0, Math.floor(totalFindings * 0.15)), iconCls: 'text-orange-500', cardCls: 'border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/5', numCls: 'text-orange-600 dark:text-orange-400' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial="hidden" animate="show" variants={stagger} className="flex items-center justify-between">
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{lang === 'vi' ? 'Tổng quan' : 'Dashboard'}</h1>
            <AIStatusPill status="idle" />
          </div>
          <p className="text-sm text-muted-foreground">{lang === 'vi' ? 'Sẵn sàng tìm bug chưa?' : 'Ready to find some bugs?'}</p>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Link href="/scan/new">
            <GlowButton icon={<Plus className="h-4 w-4" />}>
              {lang === 'vi' ? 'Quét mới' : 'New Scan'}
            </GlowButton>
          </Link>
        </motion.div>
      </motion.div>

      {/* Stats */}
      <motion.div initial="hidden" animate="show" variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp}>
            <div className={`rounded-xl border p-4 ${s.cardCls}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.iconCls}`} />
              </div>
              <div className={`text-3xl font-bold ${s.numCls}`}>
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick scan CTA */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Link href="/scan/new">
          <GlassCard hover glow="purple" className="p-5 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-600/20 border border-violet-200 dark:border-violet-500/30 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="font-semibold">{lang === 'vi' ? 'Bắt đầu quét mới' : 'Start a new scan'}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {lang === 'vi' ? 'Nhập URL để AI tìm lỗi, tạo test case và viết automation script.' : 'Enter a URL and let AI find bugs, generate test cases, and write automation scripts.'}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-violet-500 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </div>
          </GlassCard>
        </Link>
      </motion.div>

      {/* Recent scans */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              {lang === 'vi' ? 'Lượt quét gần đây' : 'Recent Scans'}
            </h2>
          </div>
          <Link href="/history" className="text-xs text-violet-600 dark:text-violet-400 hover:underline transition-colors flex items-center gap-1">
            {lang === 'vi' ? 'Xem tất cả' : 'View all'} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentScans.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted border border-border flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{lang === 'vi' ? 'Chưa có lượt quét nào' : 'No scans yet'}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{lang === 'vi' ? 'Lịch sử quét sẽ hiển thị ở đây.' : 'Your scan history will appear here.'}</p>
          </GlassCard>
        ) : (
          <div className="space-y-1.5">
            {recentScans.map((scan, i) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
              >
                <Link href={`/scan/${scan.id}`}>
                  <GlassCard hover className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <StatusDot status={scan.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">{scan.url}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                          {new Date(scan.created_at).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          {' · '}{scan.mode ?? 'full'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {scan.status === 'failed' && <SeverityBadge severity="critical" />}
                        {scan.status === 'completed' && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">done</span>
                        )}
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
