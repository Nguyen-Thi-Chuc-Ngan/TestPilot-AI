'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Search, Edit3, Save, X, Bug } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  'Passed':  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  'Failed':  'bg-red-500/15 text-red-400 border border-red-500/30',
  'Blocked': 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  'Not Run': 'bg-white/5 text-muted-foreground border border-white/10',
  'Retest':  'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  'Skipped': 'bg-gray-500/15 text-gray-400 border border-gray-500/20',
}

const PRIORITY_DOT: Record<string, string> = {
  'Critical': 'bg-red-400',
  'High':     'bg-orange-400',
  'Medium':   'bg-yellow-400',
  'Low':      'bg-green-400',
}

const STATUS_OPTIONS = ['Not Run', 'Passed', 'Failed', 'Blocked', 'Retest', 'Skipped']

interface Props {
  cases: Record<string, unknown>[]
  loading: boolean
  onUpdate: (caseId: string, updates: Record<string, unknown>) => Promise<void>
  onDelete: (caseId: string) => Promise<void>
  lang: string
}

export function TestCaseTable({ cases, loading, onUpdate, onDelete, lang }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Record<string, string>>({})
  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  const filtered = cases.filter((c) => {
    const tc = c as Record<string, unknown>
    const desc  = String(tc.description  ?? '').toLowerCase()
    const tcid  = String(tc.tc_id        ?? '').toLowerCase()
    const steps = String(tc.steps        ?? '').toLowerCase()
    const q = search.toLowerCase()
    if (search && !desc.includes(q) && !tcid.includes(q) && !steps.includes(q)) return false
    if (statusFilter !== 'All' && tc.status !== statusFilter) return false
    if (priorityFilter !== 'All' && tc.priority !== priorityFilter) return false
    return true
  })

  async function saveEdit(caseId: string) {
    await onUpdate(caseId, editData)
    setEditing(null)
    setEditData({})
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg border border-border bg-muted/20 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search by ID, description, steps...', 'Tìm theo ID, mô tả, bước...')}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none">
          <option value="All">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none">
          <option value="All">All Priority</option>
          {['Critical','High','Medium','Low'].map((p) => <option key={p}>{p}</option>)}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length}/{cases.length}</span>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">{t('No test cases match', 'Không tìm thấy')}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((c) => {
            const tc = c as Record<string, unknown>
            const id         = String(tc.id ?? '')
            const tcId       = String(tc.tc_id ?? '')
            const desc       = String(tc.description ?? '')
            const status     = String(tc.status ?? 'Not Run')
            const priority   = String(tc.priority ?? 'Medium')
            const isExpanded = expanded === id
            const isEditing  = editing  === id
            const isGroup    = desc.startsWith('▼') || desc.startsWith('▶')

            if (isGroup) {
              return (
                <div key={id} className="px-3 py-1.5 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest border-b border-border/50 bg-muted/20 rounded-lg">
                  {desc}
                </div>
              )
            }

            return (
              <div key={id} className="rounded-xl border border-border overflow-hidden">
                {/* Row */}
                <div
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : id)}
                >
                  {/* Left: priority dot + TC_ID */}
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0 pt-0.5">
                    <div className={cn('h-2 w-2 rounded-full mt-0.5', PRIORITY_DOT[priority] ?? 'bg-muted-foreground/30')} title={priority} />
                  </div>

                  {/* Center: TC_ID + description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      {tcId && (
                        <span className="text-[10px] font-mono text-muted-foreground/60 bg-muted/50 rounded px-1.5 py-0.5 flex-shrink-0">
                          {tcId}
                        </span>
                      )}
                      {tc.bug_id ? (
                        <span className="text-[10px] font-mono text-red-400/80 bg-red-500/10 rounded px-1.5 py-0.5 flex-shrink-0 flex items-center gap-1">
                          <Bug className="h-2.5 w-2.5" />{String(tc.bug_id)}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                      {desc}
                    </p>
                    {tc.steps && !isExpanded ? (
                      <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
                        {String(tc.steps).slice(0, 100)}
                      </p>
                    ) : null}
                  </div>

                  {/* Right: status + actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap', STATUS_COLORS[status] ?? STATUS_COLORS['Not Run'])}>
                      {status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditing(id)
                        setEditData({ status, actual_result: String(tc.actual_result ?? ''), bug_id: String(tc.bug_id ?? ''), notes: String(tc.notes ?? '') })
                      }}
                      className="rounded p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="h-4 w-4 text-muted-foreground/30" />
                    </motion.div>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border bg-muted/10 px-4 py-4 space-y-4">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Status</label>
                                <select value={editData.status} onChange={(e) => setEditData((d) => ({ ...d, status: e.target.value }))}
                                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/50">
                                  {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Bug ID</label>
                                <input value={editData.bug_id} onChange={(e) => setEditData((d) => ({ ...d, bug_id: e.target.value }))}
                                  placeholder="e.g. BUG-123"
                                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/50" />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Actual Result</label>
                              <textarea value={editData.actual_result} onChange={(e) => setEditData((d) => ({ ...d, actual_result: e.target.value }))}
                                rows={2} className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Notes</label>
                              <input value={editData.notes} onChange={(e) => setEditData((d) => ({ ...d, notes: e.target.value }))}
                                className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/50" />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => saveEdit(id)} className="inline-flex items-center gap-1 rounded bg-violet-600 text-white px-3 py-1.5 text-xs hover:bg-violet-500 transition-colors">
                                <Save className="h-3 w-3" /> {t('Save', 'Lưu')}
                              </button>
                              <button onClick={() => setEditing(null)} className="inline-flex items-center gap-1 rounded border border-border px-3 py-1.5 text-xs hover:bg-muted transition-colors">
                                <X className="h-3 w-3" /> {t('Cancel', 'Hủy')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-xs">
                            {([
                              ['Precondition',    tc.precondition],
                              ['Steps / Actions', tc.steps],
                              ['Test Data',       tc.test_data],
                              ['Expected Result', tc.expected_result],
                              ['Actual Result',   tc.actual_result],
                              ['Environment',     tc.environment],
                              ['Bug ID',          tc.bug_id],
                              ['Notes',           tc.notes],
                              ['AI Suggestions',  tc.ai_suggestions],
                            ] as [string, unknown][]).map(([label, val]) =>
                              val ? (
                                <div key={label} className={cn(label === 'Steps / Actions' || label === 'Expected Result' || label === 'AI Suggestions' ? 'sm:col-span-2' : '')}>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
                                  <p className="text-foreground/80 whitespace-pre-line leading-relaxed">{String(val)}</p>
                                </div>
                              ) : null
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
