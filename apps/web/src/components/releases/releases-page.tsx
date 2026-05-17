'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Rocket, Plus, Brain, Download, Loader2, CheckCircle2, AlertTriangle, XCircle, Sparkles, X, Save } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { apiClient } from '@/lib/api-client'
import { useLang } from '@/stores/language-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Release {
  id: string
  release_version: string
  project_name?: string
  client?: string
  sprint?: string
  environment?: string
  total_cases: number
  passed: number
  failed: number
  blocked: number
  not_run: number
  open_bugs: number
  critical_bugs: number
  high_bugs: number
  retest_pending: number
  risk_level: string
  signoff_status: string
  summary_notes?: string
  ai_summary?: string
  created_at: string
}

const SIGNOFF_CFG = {
  'Ready':              { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30', label: '✅ Ready to Release' },
  'Release with Risk':  { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30', label: '⚠️ Release with Risk' },
  'Not Ready':          { icon: XCircle,       color: 'text-red-500',    bg: 'bg-red-500/10 border-red-500/30',        label: '🚫 Not Ready' },
}

const RISK_COLOR: Record<string, string> = {
  Low: 'text-emerald-500', Medium: 'text-yellow-500', High: 'text-orange-500', Critical: 'text-red-500',
}

const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50'

export function ReleasesPage() {
  const { lang } = useLang()
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState<Release | null>(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    release_version: '', project_name: '', client: '', sprint: '', environment: 'Staging', summary_notes: ''
  })

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  async function load() {
    try {
      const data = await apiClient.get<Release[]>('/api/releases')
      setReleases(data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function createRelease() {
    if (!form.release_version.trim()) { toast.error('Release version required'); return }
    setSaving(true)
    try {
      const data = await apiClient.post<Release>('/api/releases', form)
      setReleases((prev) => [data, ...prev])
      setSelected(data)
      setShowCreate(false)
      toast.success(`Release ${data.release_version} created!`)
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
    finally { setSaving(false) }
  }

  async function generateAISummary(id: string) {
    setGenerating(true)
    try {
      const result = await apiClient.post<{ summary: string }>(`/api/releases/${id}/ai-summary`, {})
      setReleases((prev) => prev.map((r) => r.id === id ? { ...r, ai_summary: result.summary } : r))
      setSelected((r) => r ? { ...r, ai_summary: result.summary } : r)
      toast.success('AI summary generated!')
    } catch { toast.error('AI failed') }
    finally { setGenerating(false) }
  }

  async function deleteRelease(id: string) {
    await apiClient.delete(`/api/releases/${id}`)
    setReleases((prev) => prev.filter((r) => r.id !== id))
    if (selected?.id === id) setSelected(null)
    toast.success(t('Deleted', 'Đã xóa'))
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="h-6 w-6 text-violet-500" />
            {t('Release Summary', 'Tổng Kết Release')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('QA sign-off and release readiness', 'Ký duyệt QA và kiểm tra sẵn sàng release')}
          </p>
        </div>
        <GlowButton onClick={() => setShowCreate(true)} icon={<Plus className="h-4 w-4" />}>
          {t('New Release', 'Tạo Release')}
        </GlowButton>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length:3}).map((_,i) => <div key={i} className="h-24 rounded-xl border border-border bg-muted/20 animate-pulse" />)}</div>
      ) : releases.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Rocket className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground">{t('No release summaries yet.', 'Chưa có tổng kết release nào.')}</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {releases.map((r, i) => {
            const cfg = SIGNOFF_CFG[r.signoff_status as keyof typeof SIGNOFF_CFG] ?? SIGNOFF_CFG['Not Ready']
            const SignIcon = cfg.icon
            const isSelected = selected?.id === r.id
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard hover onClick={() => setSelected(isSelected ? null : r)}
                  className={cn('p-5 cursor-pointer', isSelected && 'border-violet-500/40 bg-violet-500/5')}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-bold text-lg">{r.release_version}</h2>
                        <span className={cn('rounded-lg border px-2.5 py-0.5 text-xs font-semibold', cfg.bg, cfg.color)}>{r.signoff_status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {r.project_name && `${r.project_name} · `}
                        {r.environment && `${r.environment} · `}
                        {r.sprint && `${r.sprint} · `}
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={cn('text-sm font-bold', RISK_COLOR[r.risk_level])}>Risk: {r.risk_level}</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center">
                    {[
                      { label: 'Passed',   value: r.passed,         color: 'text-emerald-500' },
                      { label: 'Failed',   value: r.failed,         color: 'text-red-500' },
                      { label: 'Blocked',  value: r.blocked,        color: 'text-orange-500' },
                      { label: 'Not Run',  value: r.not_run,        color: 'text-muted-foreground' },
                      { label: 'Open Bugs',value: r.open_bugs,      color: 'text-red-500' },
                      { label: 'Critical', value: r.critical_bugs,  color: 'text-red-600 font-black' },
                      { label: 'Retest',   value: r.retest_pending, color: 'text-violet-500' },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg bg-muted/30 py-2">
                        <div className={cn('text-lg font-bold', s.color)}>{s.value}</div>
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* AI Summary */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mt-4 pt-4 border-t border-border space-y-3">
                          {r.ai_summary ? (
                            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Brain className="h-4 w-4 text-violet-400" />
                                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">AI Summary</p>
                              </div>
                              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{r.ai_summary}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">{r.summary_notes || t('No notes yet.', 'Chưa có ghi chú.')}</p>
                          )}
                          <div className="flex gap-2">
                            <GlowButton size="sm" variant="secondary" onClick={() => generateAISummary(r.id)}
                              loading={generating} icon={<Sparkles className="h-3.5 w-3.5" />}>
                              {r.ai_summary ? t('Regenerate', 'Tạo lại') : t('Generate AI Summary', 'Tạo tóm tắt AI')}
                            </GlowButton>
                            <GlowButton size="sm" variant="danger" onClick={() => deleteRelease(r.id)}>
                              {t('Delete', 'Xóa')}
                            </GlowButton>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
              <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">{t('New Release Summary', 'Tạo Tổng Kết Release')}</h2>
                  <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
                </div>
                <p className="text-xs text-muted-foreground">{t('Stats will be auto-calculated from your bugs.', 'Số liệu sẽ tự tính từ bugs của bạn.')}</p>
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.release_version} onChange={(e) => setForm((f) => ({ ...f, release_version: e.target.value }))}
                    placeholder="v2.4.1 *" className={inputCls} />
                  <input value={form.project_name} onChange={(e) => setForm((f) => ({ ...f, project_name: e.target.value }))}
                    placeholder={t('Project', 'Dự án')} className={inputCls} />
                  <input value={form.client} onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                    placeholder="Client" className={inputCls} />
                  <input value={form.sprint} onChange={(e) => setForm((f) => ({ ...f, sprint: e.target.value }))}
                    placeholder="Sprint 12" className={inputCls} />
                  <input value={form.environment} onChange={(e) => setForm((f) => ({ ...f, environment: e.target.value }))}
                    placeholder="Environment" className={inputCls} />
                </div>
                <textarea value={form.summary_notes} onChange={(e) => setForm((f) => ({ ...f, summary_notes: e.target.value }))}
                  placeholder={t('Notes...', 'Ghi chú...')} rows={2} className={cn(inputCls, 'resize-none')} />
                <div className="flex justify-end gap-2">
                  <GlowButton variant="ghost" onClick={() => setShowCreate(false)}>{t('Cancel', 'Hủy')}</GlowButton>
                  <GlowButton onClick={createRelease} loading={saving} icon={<Rocket className="h-4 w-4" />}>
                    {t('Create', 'Tạo')}
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
