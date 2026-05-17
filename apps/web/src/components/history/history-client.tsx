'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, Filter, Clock, ArrowRight, Zap, Bug, FileText, ScanLine, Trash2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useLang } from '@/stores/language-store'

interface ScanJob {
  id: string
  url: string
  status: string
  mode: string
  roast_mode: boolean
  created_at: string
  completed_at?: string
}

const statusColors: Record<string, string> = {
  completed: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  running:   'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
  queued:    'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20',
  failed:    'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
}

const modeIcons: Record<string, React.ElementType> = {
  full:           Zap,
  bug_hunt:       Bug,
  test_case_only: FileText,
}

type Status = 'all' | 'completed' | 'failed' | 'running'
type Mode   = 'all' | 'full' | 'bug_hunt' | 'test_case_only'

export function HistoryClient({ scans: initialScans }: { scans: ScanJob[] }) {
  const { lang } = useLang()
  const [scans, setScans] = useState(initialScans)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<Status>('all')
  const [mode, setMode] = useState<Mode>('all')
  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().split('T')[0])
  const [dateTo,   setDateTo]   = useState('')
  const supabase = createClient()

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  const filtered = useMemo(() =>
    scans.filter((s) => {
      if (status !== 'all' && s.status !== status) return false
      if (mode !== 'all' && s.mode !== mode) return false
      if (search && !s.url.toLowerCase().includes(search.toLowerCase())) return false
      if (dateFrom && s.created_at.slice(0, 10) < dateFrom) return false
      if (dateTo   && s.created_at.slice(0, 10) > dateTo)   return false
      return true
    }), [scans, status, mode, search, dateFrom, dateTo])

  async function deleteScan(id: string) {
    await supabase.from('scan_jobs').delete().eq('id', id)
    setScans((s) => s.filter((x) => x.id !== id))
    toast.success(t('Scan deleted', 'Đã xóa'))
  }

  const statusOptions: { value: Status; label: string; label_vi: string }[] = [
    { value: 'all',       label: 'All',       label_vi: 'Tất cả' },
    { value: 'completed', label: 'Completed', label_vi: 'Xong' },
    { value: 'failed',    label: 'Failed',    label_vi: 'Lỗi' },
    { value: 'running',   label: 'Running',   label_vi: 'Đang chạy' },
  ]

  const modeOptions: { value: Mode; label: string; label_vi: string }[] = [
    { value: 'all',           label: 'All modes',   label_vi: 'Tất cả' },
    { value: 'full',          label: 'Full',        label_vi: 'Toàn diện' },
    { value: 'bug_hunt',      label: 'Bug Hunt',    label_vi: 'Tìm lỗi' },
    { value: 'test_case_only',label: 'Test Cases',  label_vi: 'Test case' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-5 w-5 text-violet-500" />
            <h1 className="text-2xl font-bold">{t('Scan History', 'Lịch Sử Quét')}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {filtered.length} / {scans.length} {t('scans', 'lượt quét')}
          </p>
        </div>
        <Link href="/scan/new">
          <button className="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-medium text-white transition-colors">
            <ScanLine className="h-4 w-4" />
            {t('New Scan', 'Quét mới')}
          </button>
        </Link>
      </div>

      {/* Filters */}
      <GlassCard className="p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search by URL...', 'Tìm theo URL...')}
            className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t('Status:', 'Trạng thái:')}</span>
          </div>
          {statusOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => setStatus(o.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                status === o.value
                  ? 'bg-violet-600 text-white border-violet-500'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              )}
            >
              {lang === 'vi' ? o.label_vi : o.label}
            </button>
          ))}

          <div className="w-px h-5 bg-border self-center mx-1" />

          {modeOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => setMode(o.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                mode === o.value
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              )}
            >
              {lang === 'vi' ? o.label_vi : o.label}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{t('Date:', 'Ngày:')}</span>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
            <span className="text-xs text-muted-foreground">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo('') }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2"
              >
                ✕ {t('Clear', 'Xóa')}
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Results */}
      {filtered.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <Clock className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground">{t('No scans match your filters', 'Không có lượt quét nào phù hợp')}</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {filtered.map((scan, i) => {
            const ModeIcon = modeIcons[scan.mode] ?? Zap
            return (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <GlassCard hover className="px-4 py-3 group">
                  <div className="flex items-center gap-3">
                    <ModeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                    <Link href={`/scan/${scan.id}`} className="flex-1 min-w-0 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">{scan.url}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                          {new Date(scan.created_at).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                          {scan.roast_mode && ' · 🔥'}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn('rounded-md border px-2 py-0.5 text-[10px] font-bold', statusColors[scan.status] ?? 'bg-muted text-muted-foreground')}>
                        {scan.status === 'completed' ? (lang === 'vi' ? 'Xong' : 'Done')
                          : scan.status === 'failed' ? (lang === 'vi' ? 'Lỗi' : 'Failed')
                          : scan.status === 'running' ? (lang === 'vi' ? 'Đang chạy' : 'Running')
                          : scan.status}
                      </span>
                      <button
                        onClick={(e) => { e.preventDefault(); deleteScan(scan.id) }}
                        className="opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground/40 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <Link href={`/scan/${scan.id}`}>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
