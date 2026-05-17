'use client'

import { useState } from 'react'
import { X, Save, Loader2, Sparkles, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STATUSES   = ['Open','In Progress','Ready for Retest','Verified','Closed','Rejected','Cannot Reproduce']
const SEVERITIES = ['Critical','Major','Minor','Trivial']
const PRIORITIES = ['Critical','High','Medium','Low']

const selectCls  = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50'
const inputCls   = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-violet-500/50'
const areaCls    = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none'

interface Props {
  bug: Record<string, unknown>
  onClose: () => void
  onUpdate: (id: string, data: Record<string, unknown>) => void
  lang: string
}

export function BugDetailDrawer({ bug, onClose, onUpdate, lang }: Props) {
  const [saving, setSaving]       = useState(false)
  const [rewriting, setRewriting] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<Record<string, string> | null>(null)

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en
  const id = String(bug.id)

  // Full editable form state — initialized from bug
  const [form, setForm] = useState({
    title:           String(bug.title           ?? ''),
    status:          String(bug.status          ?? 'Open'),
    severity:        String(bug.severity        ?? 'Minor'),
    priority:        String(bug.priority        ?? 'Medium'),
    steps:           String(bug.steps           ?? ''),
    expected_result: String(bug.expected_result ?? ''),
    actual_result:   String(bug.actual_result   ?? ''),
    module:          String(bug.module          ?? ''),
    feature:         String(bug.feature         ?? ''),
    assigned_dev:    String(bug.assigned_dev    ?? ''),
    environment:     String(bug.environment     ?? ''),
    platform:        String(bug.platform        ?? ''),
    browser:         String(bug.browser         ?? ''),
    release_version: String(bug.release_version ?? ''),
    fix_version:     String(bug.fix_version     ?? ''),
    dev_fixed_date:  String(bug.dev_fixed_date  ?? ''),
    notes:           String(bug.notes           ?? ''),
  })

  function set(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function save() {
    setSaving(true)
    try {
      const updates: Record<string, unknown> = { ...form }
      // empty strings = clear the field
      Object.keys(updates).forEach((k) => {
        if (updates[k] === '') updates[k] = null
      })
      await apiClient.patch(`/api/bugs/${id}`, updates)
      onUpdate(id, updates)
      toast.success(t('Saved!', 'Đã lưu!'))
    } catch { toast.error(lang === 'vi' ? 'Thất bại' : 'Failed') }
    finally { setSaving(false) }
  }

  async function quickMark(newStatus: string) {
    setSaving(true)
    try {
      await apiClient.patch(`/api/bugs/${id}`, { status: newStatus })
      onUpdate(id, { status: newStatus })
      set('status', newStatus)
      toast.success(`Marked ${newStatus}`)
    } catch { toast.error(lang === 'vi' ? 'Thất bại' : 'Failed') }
    finally { setSaving(false) }
  }

  async function aiRewrite() {
    setRewriting(true)
    try {
      const result = await apiClient.post<Record<string, string>>(`/api/bugs/${id}/ai-rewrite`, {})
      setAiSuggestion(result)
      toast.success(lang === 'vi' ? 'AI đã viết lại!' : 'AI rewrite ready!')
    } catch { toast.error(lang === 'vi' ? 'AI gặp lỗi' : 'AI failed') }
    finally { setRewriting(false) }
  }

  function applyAISuggestion() {
    if (!aiSuggestion) return
    if (aiSuggestion.title)              set('title', aiSuggestion.title)
    if (aiSuggestion.steps)              set('steps', aiSuggestion.steps)
    if (aiSuggestion.expected_result)    set('expected_result', aiSuggestion.expected_result)
    if (aiSuggestion.actual_result)      set('actual_result', aiSuggestion.actual_result)
    if (aiSuggestion.suggested_severity) set('severity', aiSuggestion.suggested_severity)
    if (aiSuggestion.suggested_priority) set('priority', aiSuggestion.suggested_priority)
    setAiSuggestion(null)
    toast.success(lang === 'vi' ? 'Đã áp dụng gợi ý AI!' : 'Applied AI suggestions!')
  }

  const STATUS_COLOR: Record<string, string> = {
    'Open': 'text-red-500', 'In Progress': 'text-blue-500',
    'Ready for Retest': 'text-violet-500', 'Verified': 'text-emerald-500',
    'Closed': 'text-muted-foreground', 'Rejected': 'text-gray-400',
  }

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-5 py-4 border-b border-border flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-mono text-muted-foreground bg-muted rounded px-1.5 py-0.5">{String(bug.bug_id ?? '')}</span>
            <span className={cn('text-xs font-bold', STATUS_COLOR[form.status] ?? 'text-muted-foreground')}>{form.status}</span>
          </div>
          {/* Editable title */}
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none border-b border-transparent hover:border-border focus:border-violet-500 transition-colors pb-0.5"
          />
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground flex-shrink-0 mt-0.5">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-border flex-shrink-0 flex-wrap">
        <span className="text-[10px] text-muted-foreground mr-1">{t('Mark:', 'Đánh dấu:')}</span>
        <button onClick={() => quickMark('Verified')} disabled={saving}
          className="flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 px-2 py-1 text-[10px] font-semibold hover:bg-emerald-500/25 transition-colors disabled:opacity-40">
          <CheckCircle2 className="h-3 w-3" /> Verified
        </button>
        <button onClick={() => quickMark('Ready for Retest')} disabled={saving}
          className="flex items-center gap-1 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-500 px-2 py-1 text-[10px] font-semibold hover:bg-violet-500/25 transition-colors disabled:opacity-40">
          <RotateCcw className="h-3 w-3" /> Retest
        </button>
        <button onClick={() => quickMark('Closed')} disabled={saving}
          className="flex items-center gap-1 rounded-lg bg-muted border border-border text-muted-foreground px-2 py-1 text-[10px] font-semibold hover:bg-muted/80 transition-colors disabled:opacity-40">
          <XCircle className="h-3 w-3" /> Close
        </button>
        <button onClick={aiRewrite} disabled={rewriting}
          className="ml-auto flex items-center gap-1 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-400 px-2 py-1 text-[10px] font-semibold hover:bg-violet-600/30 transition-colors disabled:opacity-40">
          {rewriting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {lang === 'vi' ? 'AI Viết Lại' : 'AI Rewrite'}
        </button>
      </div>

      {/* Form — all fields editable */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* AI suggestion */}
        {aiSuggestion && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">{lang === 'vi' ? 'Gợi Ý AI' : 'AI Suggestion'}</p>
              <button onClick={() => setAiSuggestion(null)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            </div>
            <p className="text-xs text-white/60">{aiSuggestion.title}</p>
            {aiSuggestion.suggested_severity && (
              <p className="text-xs text-violet-400">Suggested: <strong>{aiSuggestion.suggested_severity}</strong> / <strong>{aiSuggestion.suggested_priority}</strong></p>
            )}
            <button onClick={applyAISuggestion}
              className="text-xs text-violet-400 border border-violet-500/30 rounded-lg px-3 py-1 hover:bg-violet-500/10 transition-colors">
              {lang === 'vi' ? 'Áp dụng' : 'Apply suggestion'}
            </button>
          </div>
        )}

        {/* Classification */}
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: 'status' as const,   label: 'Status',   opts: STATUSES },
            { key: 'severity' as const, label: 'Severity', opts: SEVERITIES },
            { key: 'priority' as const, label: 'Priority', opts: PRIORITIES },
          ]).map((f) => (
            <div key={f.key}>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">{f.label}</label>
              <select value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} className={selectCls}>
                {f.opts.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Context */}
        <div className="grid grid-cols-2 gap-2">
          {([
            { key: 'module' as const,          label: t('Module', 'Module'),               ph: 'e.g. Login' },
            { key: 'feature' as const,         label: t('Feature', 'Tính năng'),           ph: 'e.g. QR Scan' },
            { key: 'assigned_dev' as const,    label: t('Assigned Dev', 'Dev phụ trách'),  ph: 'Dev name' },
            { key: 'environment' as const,     label: t('Environment', 'Môi trường'),      ph: 'Staging / Prod' },
            { key: 'platform' as const,        label: t('Platform', 'Nền tảng'),           ph: 'Android / iOS' },
            { key: 'browser' as const,         label: t('Browser', 'Trình duyệt'),         ph: 'Chrome 124' },
            { key: 'release_version' as const, label: t('Release', 'Phiên bản'),           ph: 'v2.4.1' },
            { key: 'fix_version' as const,     label: t('Fix Version', 'Phiên bản fix'),   ph: 'v2.4.2' },
          ]).map((f) => (
            <div key={f.key}>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">{f.label}</label>
              <input value={form[f.key]} onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.ph} className={inputCls} />
            </div>
          ))}
        </div>

        {/* Dev fixed date */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">{lang === 'vi' ? 'Ngày Dev Fix' : 'Dev Fixed Date'}</label>
          <input type="date" value={form.dev_fixed_date} onChange={(e) => set('dev_fixed_date', e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50" />
        </div>

        {/* Content fields */}
        {([
          { key: 'steps' as const,           label: t('Steps to Reproduce', 'Các bước tái hiện'), rows: 4, ph: '1. Navigate to...\n2. Click...\n3. Observe...' },
          { key: 'expected_result' as const, label: t('Expected Result', 'Kết quả mong đợi'),     rows: 2, ph: 'What should happen...' },
          { key: 'actual_result' as const,   label: t('Actual Result', 'Kết quả thực tế'),        rows: 2, ph: 'What actually happened...' },
          { key: 'notes' as const,           label: t('Notes', 'Ghi chú'),                        rows: 2, ph: 'Additional notes...' },
        ]).map((f) => (
          <div key={f.key}>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">{f.label}</label>
            <textarea value={form[f.key]} onChange={(e) => set(f.key, e.target.value)}
              rows={f.rows} placeholder={f.ph} className={areaCls} />
          </div>
        ))}

        {/* Save */}
        <button onClick={save} disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t('Save changes', 'Lưu thay đổi')}
        </button>
      </div>
    </div>
  )
}
