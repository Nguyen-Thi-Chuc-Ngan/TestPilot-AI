'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, ChevronRight, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

export const QA_STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  'Not Run': { label: 'Not Run', cls: 'bg-muted/50 text-muted-foreground border border-border' },
  'Passed':  { label: 'Passed',  cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  'Failed':  { label: 'Failed',  cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
  'Blocked': { label: 'Blocked', cls: 'bg-orange-500/15 text-orange-400 border border-orange-500/30' },
  'Retest':  { label: 'Retest',  cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  'Skipped': { label: 'Skipped', cls: 'bg-gray-500/10 text-gray-500 border border-gray-500/20' },
  'Closed':  { label: 'Closed',  cls: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
}

export const DEV_STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  'Open':          { label: 'Open',          cls: 'text-muted-foreground/60' },
  'In Progress':   { label: 'In Progress',   cls: 'text-yellow-400' },
  'Ready for QA':  { label: 'Ready for QA',  cls: 'text-blue-400' },
  'Rejected':      { label: 'Rejected',      cls: 'text-red-400' },
  'Closed':        { label: 'Closed',        cls: 'text-emerald-400' },
}

export const PRIORITY_CONFIG: Record<string, { dot: string; label: string }> = {
  'Critical': { dot: 'bg-red-400',    label: 'Critical' },
  'High':     { dot: 'bg-orange-400', label: 'High' },
  'Medium':   { dot: 'bg-yellow-400', label: 'Medium' },
  'Low':      { dot: 'bg-green-400',  label: 'Low' },
}

interface Props {
  cases: Record<string, unknown>[]
  loading: boolean
  selectedId: string | null
  onSelect: (tc: Record<string, unknown>) => void
  onQuickStatus: (id: string, status: string) => void
  lang: string
}

export function ExecutionTable({ cases, loading, selectedId, onSelect, onQuickStatus, lang }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  // Group cases by section headers (▼ rows)
  const grouped = useMemo(() => {
    const groups: { label: string; key: string; items: Record<string, unknown>[] }[] = []
    let current: { label: string; key: string; items: Record<string, unknown>[] } = { label: '', key: '__default__', items: [] }

    const filtered = cases.filter((c) => {
      const tc = c as Record<string, unknown>
      const desc = String(tc.description ?? '').toLowerCase()
      const tcid = String(tc.tc_id ?? '').toLowerCase()
      if (search && !desc.includes(search.toLowerCase()) && !tcid.includes(search.toLowerCase())) return false
      if (statusFilter !== 'All' && tc.status !== statusFilter) return false
      if (priorityFilter !== 'All' && tc.priority !== priorityFilter) return false
      return true
    })

    for (const c of filtered) {
      const tc = c as Record<string, unknown>
      const desc = String(tc.description ?? '')
      if (desc.startsWith('▼') || desc.startsWith('▶')) {
        if (current.items.length > 0 || current.label) groups.push(current)
        current = { label: desc.replace(/^[▼▶]\s*/, ''), key: desc, items: [] }
      } else {
        current.items.push(c)
      }
    }
    if (current.items.length > 0 || current.label) groups.push(current)
    return groups
  }, [cases, search, statusFilter, priorityFilter])

  const totalFiltered = grouped.reduce((a, g) => a + g.items.length, 0)

  if (loading) {
    return <div className="space-y-1">{Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="h-10 rounded-lg bg-muted/30 animate-pulse" />
    ))}</div>
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search...', 'Tìm kiếm...')}
            className="w-full rounded-lg bg-muted/50 border border-border pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg bg-muted/50 border border-border px-2 py-1.5 text-xs text-foreground/60 focus:outline-none">
          <option value="All">{lang === 'vi' ? 'Tất cả' : 'All Status'}</option>
          {Object.keys(QA_STATUS_CONFIG).map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg bg-muted/50 border border-border px-2 py-1.5 text-xs text-foreground/60 focus:outline-none">
          <option value="All">{lang === 'vi' ? 'Tất cả' : 'All Priority'}</option>
          {['Critical','High','Medium','Low'].map((p) => <option key={p}>{p}</option>)}
        </select>
        <span className="text-[10px] text-muted-foreground/50 flex-shrink-0 font-mono">{totalFiltered}/{cases.length}</span>
      </div>

      {/* Column header */}
      <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest border-b border-border/50 flex-shrink-0">
        <span className="col-span-2">TC_ID</span>
        <span className="col-span-5">Title</span>
        <span className="col-span-1 text-center">P</span>
        <span className="col-span-2 text-center">{lang === 'vi' ? 'Trạng thái QA' : 'QA Status'}</span>
        <span className="col-span-2 text-center">Dev</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {grouped.map((group) => {
          const isCollapsed = collapsedGroups.has(group.key)
          return (
            <div key={group.key}>
              {/* Group header */}
              {group.label && (
                <button
                  onClick={() => setCollapsedGroups((prev) => {
                    const next = new Set(prev)
                    next.has(group.key) ? next.delete(group.key) : next.add(group.key)
                    return next
                  })}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/20 hover:bg-muted/40 transition-colors border-b border-border/50"
                >
                  {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {group.label}
                  <span className="ml-auto font-normal text-muted-foreground/50">{group.items.length}</span>
                </button>
              )}

              {/* Cases */}
              <AnimatePresence>
                {!isCollapsed && group.items.map((c) => {
                  const tc = c as Record<string, unknown>
                  const id       = String(tc.id ?? '')
                  const tcId     = String(tc.tc_id ?? '')
                  const desc     = String(tc.description ?? '')
                  const status   = String(tc.status ?? 'Not Run')
                  const devStatus = String(tc.dev_status ?? 'Open')
                  const priority = String(tc.priority ?? 'Medium')
                  const isSelected = selectedId === id

                  const qaCfg  = QA_STATUS_CONFIG[status]  ?? QA_STATUS_CONFIG['Not Run']
                  const devCfg = DEV_STATUS_CONFIG[devStatus] ?? DEV_STATUS_CONFIG['Open']
                  const priCfg = PRIORITY_CONFIG[priority]  ?? PRIORITY_CONFIG['Medium']

                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        'grid grid-cols-12 gap-2 px-3 py-2 items-center border-b border-border/50 cursor-pointer transition-colors group',
                        isSelected ? 'bg-violet-500/10 border-l-2 border-l-violet-500' : 'hover:bg-muted/30'
                      )}
                      onClick={() => onSelect(c)}
                    >
                      {/* TC_ID */}
                      <span className="col-span-2 text-[10px] font-mono text-muted-foreground truncate">{tcId}</span>

                      {/* Title */}
                      <span className="col-span-5 text-xs text-foreground/80 truncate leading-tight">{desc}</span>

                      {/* Priority dot */}
                      <div className="col-span-1 flex justify-center">
                        <div className={cn('h-2 w-2 rounded-full', priCfg.dot)} title={priority} />
                      </div>

                      {/* QA Status — click to cycle */}
                      <div className="col-span-2 flex justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const statuses = Object.keys(QA_STATUS_CONFIG)
                            const next = statuses[(statuses.indexOf(status) + 1) % statuses.length]
                            onQuickStatus(id, next)
                          }}
                          className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap transition-opacity hover:opacity-70', qaCfg.cls)}
                          title="Click to change status"
                        >
                          {qaCfg.label}
                        </button>
                      </div>

                      {/* Dev status */}
                      <div className="col-span-2 flex justify-center">
                        <span className={cn('text-[10px] truncate', devCfg.cls)}>{devStatus === 'Open' ? '—' : devCfg.label}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )
        })}

        {totalFiltered === 0 && (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground/50">
            {t('No test cases match', 'Không có kết quả')}
          </div>
        )}
      </div>
    </div>
  )
}
