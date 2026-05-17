'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bug, Plus, Search, Sparkles, X, Save, Loader2, ChevronDown, ExternalLink } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { useLang } from '@/stores/language-store'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BugDetailDrawer } from './bug-detail-drawer'

interface BugItem {
  id: string
  bug_id: string
  title: string
  severity: string
  priority: string
  status: string
  retest_status: string
  project_name?: string
  module?: string
  assigned_dev?: string
  created_at: string
}

const SEVERITY_CFG: Record<string, { cls: string }> = {
  Critical: { cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  Major:    { cls: 'bg-orange-500/15 text-orange-400 border border-orange-500/30' },
  Minor:    { cls: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  Trivial:  { cls: 'bg-muted text-muted-foreground border border-border' },
}

const STATUS_CFG: Record<string, string> = {
  'Open':               'text-red-500',
  'In Progress':        'text-blue-500',
  'Ready for Retest':   'text-violet-500',
  'Verified':           'text-emerald-500',
  'Closed':             'text-muted-foreground line-through',
  'Rejected':           'text-gray-400',
  'Cannot Reproduce':   'text-yellow-500',
}

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial']
const STATUSES   = ['Open', 'In Progress', 'Ready for Retest', 'Verified', 'Closed', 'Rejected', 'Cannot Reproduce']
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low']

export function BugTrackerPage() {
  const { lang } = useLang()
  const [bugs, setBugs] = useState<BugItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterSeverity, setFilterSeverity] = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedBug, setSelectedBug] = useState<Record<string, unknown> | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', severity: 'Minor', priority: 'Medium', status: 'Open',
    project_name: '', module: '', assigned_dev: '', steps: '',
    expected_result: '', actual_result: '', notes: '',
  })

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'All') params.set('status', filterStatus)
      if (filterSeverity !== 'All') params.set('severity', filterSeverity)
      if (search) params.set('search', search)
      const data = await apiClient.get<BugItem[]>(`/api/bugs?${params}`)
      setBugs(data)
    } catch { toast.error(lang === 'vi' ? 'Không thể tải danh sách bug' : 'Failed to load bugs') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filterStatus, filterSeverity])

  async function createBug() {
    if (!form.title.trim()) { toast.error(lang === 'vi' ? 'Vui lòng nhập tiêu đề' : 'Title required'); return }
    setSaving(true)
    try {
      const bug = await apiClient.post<BugItem>('/api/bugs', form)
      setBugs((prev) => [bug, ...prev])
      setShowCreate(false)
      setForm({ title: '', severity: 'Minor', priority: 'Medium', status: 'Open', project_name: '', module: '', assigned_dev: '', steps: '', expected_result: '', actual_result: '', notes: '' })
      toast.success(lang === 'vi' ? `${bug.bug_id} đã được tạo!` : `${bug.bug_id} created!`)
    } catch (e) { toast.error(e instanceof Error ? e.message : (lang === 'vi' ? 'Thất bại' : 'Failed')) }
    finally { setSaving(false) }
  }

  async function quickStatus(id: string, status: string) {
    await apiClient.patch(`/api/bugs/${id}`, { status })
    setBugs((prev) => prev.map((b) => b.id === id ? { ...b, status } : b))
    if (selectedBug?.id === id) setSelectedBug((b) => b ? { ...b, status } : b)
  }

  const filtered = bugs.filter((b) => {
    if (search && !b.title.toLowerCase().includes(search.toLowerCase()) && !b.bug_id.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = {
    open: bugs.filter((b) => b.status === 'Open').length,
    critical: bugs.filter((b) => b.severity === 'Critical' && b.status !== 'Closed').length,
    retest: bugs.filter((b) => b.status === 'Ready for Retest').length,
  }

  const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50'

  return (
    <div className="flex gap-0 h-full -m-6">
      {/* Main panel */}
      <div className={cn('flex flex-col flex-1 min-w-0 p-6 space-y-4', selectedBug && 'lg:mr-0')}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bug className="h-6 w-6 text-red-500" />
              {t('Bug Tracker', 'Theo Dõi Bug')}
            </h1>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span className="text-red-500 font-bold">{counts.open} {lang === 'vi' ? 'đang mở' : 'open'}</span>
              <span className="text-orange-500 font-bold">{counts.critical} {lang === 'vi' ? 'nghiêm trọng' : 'critical'}</span>
              <span className="text-violet-500 font-bold">{counts.retest} {lang === 'vi' ? 'cần retest' : 'retest needed'}</span>
            </div>
          </div>
          <GlowButton onClick={() => setShowCreate(true)} icon={<Plus className="h-4 w-4" />}>
            {t('Report Bug', 'Báo Bug')}
          </GlowButton>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder={t('Search bug ID or title...', 'Tìm bug ID hoặc tiêu đề...')}
              className={cn(inputCls, 'pl-9')} />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none">
            <option value="All">{lang === 'vi' ? 'Tất cả trạng thái' : 'All Status'}</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none">
            <option value="All">{lang === 'vi' ? 'Tất cả severity' : 'All Severity'}</option>
            {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <span className="text-xs text-muted-foreground">{filtered.length}/{bugs.length}</span>
        </div>

        {/* Table header */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
          <span className="w-24 flex-shrink-0">Bug ID</span>
          <span className="flex-1">Title</span>
          <span className="w-20 flex-shrink-0 text-center">Severity</span>
          <span className="w-32 flex-shrink-0 text-center">Status</span>
          <span className="w-24 flex-shrink-0 text-center">Dev</span>
        </div>

        {/* Bug list */}
        {loading ? (
          <div className="space-y-1.5">{Array.from({length:5}).map((_,i) => <div key={i} className="h-12 rounded-lg border border-border bg-muted/20 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Bug className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">{t('No bugs found. Good job! 🎉', 'Không có bug nào. Tốt lắm! 🎉')}</p>
          </GlassCard>
        ) : (
          <div className="space-y-1">
            {filtered.map((bug, i) => {
              const sevCfg = SEVERITY_CFG[bug.severity] ?? SEVERITY_CFG.Trivial
              const isSelected = selectedBug?.id === bug.id
              return (
                <motion.div key={bug.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <div
                    onClick={() => setSelectedBug(bug as unknown as Record<string, unknown>)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all group',
                      isSelected ? 'border-violet-500/40 bg-violet-500/8' : 'border-border hover:bg-muted/30'
                    )}
                  >
                    <span className="w-24 flex-shrink-0 text-[10px] font-mono text-muted-foreground">{bug.bug_id}</span>
                    <span className="flex-1 text-sm font-medium truncate">{bug.title}</span>
                    <span className={cn('w-20 flex-shrink-0 text-center rounded-full px-2 py-0.5 text-[10px] font-bold', sevCfg.cls)}>{bug.severity}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); const next = STATUSES[(STATUSES.indexOf(bug.status)+1)%STATUSES.length]; quickStatus(bug.id, next) }}
                      className={cn('w-32 flex-shrink-0 text-center text-[10px] font-medium truncate hover:opacity-70 transition-opacity', STATUS_CFG[bug.status] ?? 'text-muted-foreground')}
                      title={lang === 'vi' ? 'Bấm để đổi trạng thái' : 'Click to change status'}
                    >
                      {bug.status}
                    </button>
                    <span className="w-24 flex-shrink-0 text-[10px] text-muted-foreground truncate text-center">{bug.assigned_dev || '—'}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Right drawer */}
      <AnimatePresence>
        {selectedBug && (
          <motion.div
            initial={{ width: 0 }} animate={{ width: 400 }} exit={{ width: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="flex-shrink-0 overflow-hidden border-l border-border"
          >
            <BugDetailDrawer
              bug={selectedBug}
              onClose={() => setSelectedBug(null)}
              onUpdate={(id, data) => {
                setBugs((prev) => prev.map((b) => b.id === id ? { ...b, ...data } : b))
                setSelectedBug((b) => b ? { ...b, ...data } : b)
              }}
              lang={lang}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
              <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg flex items-center gap-2"><Bug className="h-5 w-5 text-red-500" />{t('Report Bug', 'Báo Bug')}</h2>
                  <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                </div>

                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder={t('Bug title *', 'Tiêu đề bug *')} className={inputCls} />

                <div className="grid grid-cols-3 gap-3">
                  {([
                    { key: 'severity', label: 'Severity', opts: SEVERITIES },
                    { key: 'priority', label: 'Priority', opts: PRIORITIES },
                    { key: 'status',   label: 'Status',   opts: STATUSES.slice(0,4) },
                  ] as { key: keyof typeof form; label: string; opts: string[] }[]).map((f) => (
                    <div key={f.key}>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">{f.label}</label>
                      <select value={form[f.key]} onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none">
                        {f.opts.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input value={form.project_name} onChange={(e) => setForm((f) => ({ ...f, project_name: e.target.value }))}
                    placeholder={t('Project', 'Dự án')} className={inputCls} />
                  <input value={form.module} onChange={(e) => setForm((f) => ({ ...f, module: e.target.value }))}
                    placeholder="Module" className={inputCls} />
                  <input value={form.assigned_dev} onChange={(e) => setForm((f) => ({ ...f, assigned_dev: e.target.value }))}
                    placeholder={t('Assigned Dev', 'Dev phụ trách')} className={inputCls} />
                </div>

                <textarea value={form.steps} onChange={(e) => setForm((f) => ({ ...f, steps: e.target.value }))}
                  placeholder={t('Steps to reproduce...', 'Các bước tái hiện...')} rows={3}
                  className={cn(inputCls, 'resize-none')} />

                <div className="grid grid-cols-2 gap-3">
                  <textarea value={form.expected_result} onChange={(e) => setForm((f) => ({ ...f, expected_result: e.target.value }))}
                    placeholder={t('Expected result', 'Kết quả mong đợi')} rows={2} className={cn(inputCls, 'resize-none')} />
                  <textarea value={form.actual_result} onChange={(e) => setForm((f) => ({ ...f, actual_result: e.target.value }))}
                    placeholder={t('Actual result', 'Kết quả thực tế')} rows={2} className={cn(inputCls, 'resize-none')} />
                </div>

                <div className="flex justify-end gap-2">
                  <GlowButton variant="ghost" onClick={() => setShowCreate(false)}>{t('Cancel', 'Hủy')}</GlowButton>
                  <GlowButton onClick={createBug} loading={saving} icon={<Save className="h-4 w-4" />}>
                    {t('Create Bug', 'Tạo Bug')}
                  </GlowButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
