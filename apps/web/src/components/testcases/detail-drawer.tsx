'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, XCircle, RotateCcw, Bug, Brain, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QA_STATUS_CONFIG, DEV_STATUS_CONFIG, PRIORITY_CONFIG } from './execution-table'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

const QA_STATUSES  = Object.keys(QA_STATUS_CONFIG)
const DEV_STATUSES = Object.keys(DEV_STATUS_CONFIG)

const selectCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50'

interface Props {
  tc: Record<string, unknown> | null
  onClose: () => void
  onUpdate: (id: string, data: Record<string, unknown>) => void
  lang: string
}

export function DetailDrawer({ tc, onClose, onUpdate, lang }: Props) {
  const [activeTab, setActiveTab] = useState<'detail' | 'execution' | 'ai'>('detail')
  const [editStatus, setEditStatus]       = useState('')
  const [editDevStatus, setEditDevStatus] = useState('')
  const [actualResult, setActualResult]   = useState('')
  const [bugId, setBugId]                 = useState('')
  const [notes, setNotes]                 = useState('')
  const [saving, setSaving]               = useState(false)

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  if (!tc) return null

  const id        = String(tc.id ?? '')
  const tcId      = String(tc.tc_id ?? '')
  const desc      = String(tc.description ?? '')
  const status    = editStatus    || String(tc.status     ?? 'Not Run')
  const devStatus = editDevStatus || String(tc.dev_status ?? 'Open')
  const priority  = String(tc.priority ?? 'Medium')

  const qaCfg  = QA_STATUS_CONFIG[status]   ?? QA_STATUS_CONFIG['Not Run']
  const priCfg = PRIORITY_CONFIG[priority]  ?? PRIORITY_CONFIG['Medium']

  async function handleSave() {
    setSaving(true)
    const updates: Record<string, unknown> = {}
    if (editStatus)    updates.status       = editStatus
    if (editDevStatus) updates.dev_status   = editDevStatus
    if (actualResult)  updates.actual_result = actualResult
    if (bugId)         updates.bug_id       = bugId
    if (notes)         updates.notes        = notes
    try {
      await apiClient.post(`/api/testcases/${id}`, updates)
      onUpdate(id, updates)
      toast.success(t('Saved!', 'Da luu!'))
      setEditStatus(''); setEditDevStatus(''); setActualResult(''); setBugId(''); setNotes('')
    } catch { toast.error(t('Save failed', 'Luu that bai')) }
    finally { setSaving(false) }
  }

  async function quickMark(newStatus: string) {
    setSaving(true)
    try {
      await apiClient.post(`/api/testcases/${id}`, { status: newStatus })
      onUpdate(id, { status: newStatus })
      setEditStatus(newStatus)
      toast.success(`Marked ${newStatus}`)
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  function Field({ label, value }: { label: string; value: unknown }) {
    const str = value != null && value !== '' ? String(value) : null
    if (!str) return null
    return (
      <div>
        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xs text-foreground/70 whitespace-pre-line leading-relaxed">{str}</p>
      </div>
    )
  }

  const tabs = [
    { key: 'detail' as const,    label: t('Detail', 'Chi tiet') },
    { key: 'execution' as const, label: t('Execution', 'Thuc thi') },
    { key: 'ai' as const,        label: 'AI Insight' },
  ]

  return (
    <div className="flex flex-col h-full border-l border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {tcId && (
              <span className="text-[10px] font-mono text-muted-foreground/60 bg-muted/50 rounded px-1.5 py-0.5">{tcId}</span>
            )}
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', qaCfg.cls)}>{qaCfg.label}</span>
            <div className="flex items-center gap-1">
              <div className={cn('h-2 w-2 rounded-full', priCfg.dot)} />
              <span className="text-[10px] text-muted-foreground/60">{priority}</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-foreground/90 leading-snug">{desc}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground/60 hover:text-foreground/60 transition-colors flex-shrink-0 mt-0.5">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border flex-shrink-0">
        <span className="text-[10px] text-muted-foreground/40 mr-1">{t('Mark as:', 'Danh dau:')}</span>
        <button onClick={() => quickMark('Passed')} disabled={saving}
          title={t('Mark this test case as Passed', 'Danh dau test case nay la Passed')}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-500/25 transition-colors disabled:opacity-40">
          <CheckCircle2 className="h-3.5 w-3.5" /> Pass
        </button>
        <button onClick={() => quickMark('Failed')} disabled={saving}
          title={t('Mark this test case as Failed', 'Danh dau test case nay la Failed')}
          className="flex items-center gap-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 px-3 py-1.5 text-xs font-semibold hover:bg-red-500/25 transition-colors disabled:opacity-40">
          <XCircle className="h-3.5 w-3.5" /> Fail
        </button>
        <button onClick={() => quickMark('Retest')} disabled={saving}
          title={t('Mark for retest after dev fixes', 'Danh dau can test lai sau khi dev fix')}
          className="flex items-center gap-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 px-3 py-1.5 text-xs font-semibold hover:bg-blue-500/25 transition-colors disabled:opacity-40">
          <RotateCcw className="h-3.5 w-3.5" /> Retest
        </button>
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/60 ml-auto" />}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border flex-shrink-0">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('px-4 py-2.5 text-xs font-medium transition-colors relative', activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground/70 hover:text-foreground/60')}>
            {tab.label}
            {activeTab === tab.key && (
              <motion.div layoutId="drawer-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* DETAIL */}
        {activeTab === 'detail' && (
          <div className="space-y-4">
            <Field label="Precondition"    value={tc.precondition} />
            <Field label="Steps / Actions" value={tc.steps} />
            <Field label="Test Data"       value={tc.test_data} />
            <Field label="Expected Result" value={tc.expected_result} />
            <Field label="Module"          value={tc.module} />
            <Field label="Feature"         value={tc.feature} />
            <Field label="Test Type"       value={tc.test_type} />
            <Field label="Automation"      value={tc.automation_status} />
          </div>
        )}

        {/* EXECUTION */}
        {activeTab === 'execution' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1.5 block">QA Status</label>
                <select value={editStatus || status} onChange={(e) => setEditStatus(e.target.value)} className={selectCls}>
                  {QA_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1.5 block">Dev Status</label>
                <select value={editDevStatus || devStatus} onChange={(e) => setEditDevStatus(e.target.value)} className={selectCls}>
                  {DEV_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {tc.actual_result != null && tc.actual_result !== '' && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">Current Actual Result</p>
                <p className="text-xs text-foreground/50 bg-muted/30 rounded-lg p-3">{String(tc.actual_result)}</p>
              </div>
            )}

            {tc.bug_id != null && tc.bug_id !== '' && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <Bug className="h-3.5 w-3.5" />
                <span>Bug: <strong>{String(tc.bug_id)}</strong></span>
              </div>
            )}

            {tc.notes != null && tc.notes !== '' && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">Notes</p>
                <p className="text-xs text-foreground/50">{String(tc.notes)}</p>
              </div>
            )}

            {/* Update form */}
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Update</p>
              <textarea value={actualResult} onChange={(e) => setActualResult(e.target.value)}
                placeholder={t('Actual result...', 'Ket qua thuc te...')}
                rows={3}
                className="w-full rounded-lg bg-muted/50 border border-border px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none" />
              <div className="grid grid-cols-2 gap-2">
                <input value={bugId} onChange={(e) => setBugId(e.target.value)}
                  placeholder="Bug ID (e.g. BUG-219)"
                  className="rounded-lg bg-muted/50 border border-border px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50" />
                <input value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('Notes...', 'Ghi chu...')}
                  className="rounded-lg bg-muted/50 border border-border px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50" />
              </div>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-foreground px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-40 w-full justify-center">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {t('Save', 'Luu')}
              </button>
            </div>
          </div>
        )}

        {/* AI */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            {tc.ai_suggestions != null && tc.ai_suggestions !== '' ? (
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-2">AI Suggestion</p>
                <p className="text-xs text-foreground/60 leading-relaxed">{String(tc.ai_suggestions)}</p>
              </div>
            ) : null}
            {tc.weakness_reason != null && tc.weakness_reason !== '' ? (
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2">Weakness</p>
                <p className="text-xs text-foreground/60">{String(tc.weakness_reason)}</p>
              </div>
            ) : null}
            {(tc.ai_suggestions == null || tc.ai_suggestions === '') && (tc.weakness_reason == null || tc.weakness_reason === '') && (
              <div className="rounded-xl border border-border bg-muted/20 p-8 text-center">
                <Brain className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground/60">
                  {t('Run AI Analysis on this suite to get insights.', 'Chay Phan tich AI de xem goi y.')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
