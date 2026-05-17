'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckCircle2, Circle, Clock, AlertTriangle, Flag, Trash2, Edit3, Save, X, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { useLang } from '@/stores/language-store'
import { cn } from '@/lib/utils'

interface Todo {
  id: string
  title: string
  priority: string
  status: string
  due_date?: string
  linked_bug?: string
  notes?: string
  project_name?: string
  pinned: boolean
  created_at: string
}

const STATUS_CONFIG = {
  'Todo':         { label: 'Todo',         color: 'text-muted-foreground',  bg: 'bg-muted/50',        icon: Circle },
  'In Progress':  { label: 'In Progress',  color: 'text-blue-500',          bg: 'bg-blue-500/10',     icon: Clock },
  'Waiting Dev':  { label: 'Waiting Dev',  color: 'text-yellow-500',        bg: 'bg-yellow-500/10',   icon: Clock },
  'Waiting QA':   { label: 'Waiting QA',   color: 'text-orange-500',        bg: 'bg-orange-500/10',   icon: Clock },
  'Done':         { label: 'Done',         color: 'text-emerald-500',       bg: 'bg-emerald-500/10',  icon: CheckCircle2 },
  'Blocked':      { label: 'Blocked',      color: 'text-red-500',           bg: 'bg-red-500/10',      icon: AlertTriangle },
}

const PRIORITY_CONFIG = {
  'Critical': { color: 'text-red-500',    dot: 'bg-red-500' },
  'High':     { color: 'text-orange-500', dot: 'bg-orange-500' },
  'Medium':   { color: 'text-yellow-500', dot: 'bg-yellow-500' },
  'Low':      { color: 'text-green-500',  dot: 'bg-green-500' },
}

const STATUSES = Object.keys(STATUS_CONFIG)
const PRIORITIES = Object.keys(PRIORITY_CONFIG)

const VIEWS = ['Today', 'All', 'In Progress', 'Done'] as const
type View = typeof VIEWS[number]

export function TodoBoard() {
  const { lang } = useLang()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<View>('Today')
  const [quickAdd, setQuickAdd] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Todo>>({})
  const todayStr = new Date().toISOString().split('T')[0]
  const [dueDateFrom, setDueDateFrom] = useState(todayStr)
  const [dueDateTo,   setDueDateTo]   = useState('')
  const supabase = createClient()

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  async function loadTodos() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('qa_todos')
      .select('*')
      .eq('user_id', user.id)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setTodos(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadTodos() }, [])

  async function addTodo() {
    if (!quickAdd.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const now = new Date().toISOString()
    const { data } = await supabase.from('qa_todos').insert({
      user_id: user.id,
      title: quickAdd,
      status: 'Todo',
      priority: 'Medium',
      created_at: now,
      updated_at: now,
    }).select().single()
    if (data) setTodos((prev) => [data, ...prev])
    setQuickAdd('')
    toast.success(t('Todo added!', 'Da them!'))
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('qa_todos').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, status } : t))
  }

  async function deleteTodo(id: string) {
    await supabase.from('qa_todos').delete().eq('id', id)
    setTodos((prev) => prev.filter((t) => t.id !== id))
    toast.success(t('Deleted', 'Da xoa'))
  }

  async function saveEdit(id: string) {
    await supabase.from('qa_todos').update({ ...editData, updated_at: new Date().toISOString() }).eq('id', id)
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, ...editData } : t))
    setEditId(null)
    setEditData({})
    toast.success(t('Saved!', 'Da luu!'))
  }

  const today = new Date().toISOString().split('T')[0]

  const filtered = todos.filter((todo) => {
    if (activeView === 'Today')       { if (!(!todo.due_date || todo.due_date <= today)) return false }
    else if (activeView === 'In Progress') { if (todo.status !== 'In Progress') return false }
    else if (activeView === 'Done')        { if (todo.status !== 'Done') return false }
    if (dueDateFrom && todo.due_date && todo.due_date < dueDateFrom) return false
    if (dueDateTo   && todo.due_date && todo.due_date > dueDateTo)   return false
    return true
  })

  const counts = {
    Today:       todos.filter((t) => !t.due_date || t.due_date <= today).length,
    All:         todos.length,
    'In Progress': todos.filter((t) => t.status === 'In Progress').length,
    Done:        todos.filter((t) => t.status === 'Done').length,
  }

  const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-violet-500" />
            {lang === 'vi' ? 'Việc Cần Làm' : 'QA Todo List'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'vi' ? 'Theo dõi công việc QA hàng ngày' : 'Your daily QA task tracker'}
          </p>
        </div>
      </div>

      {/* Quick add */}
      <GlassCard className="p-3">
        <div className="flex gap-2">
          <input
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder={lang === 'vi' ? 'Thêm việc... (Enter để lưu)' : 'Add a task... (Enter to save)'}
            className={cn(inputCls, 'flex-1')}
          />
          <GlowButton onClick={addTodo} disabled={!quickAdd.trim()} icon={<Plus className="h-4 w-4" />}>
            {lang === 'vi' ? 'Thêm' : 'Add'}
          </GlowButton>
        </div>
      </GlassCard>

      {/* View tabs */}
      <div className="flex gap-1 border-b border-border pb-0">
        {VIEWS.map((view) => (
          <button key={view} onClick={() => setActiveView(view)}
            className={cn('flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors relative',
              activeView === view ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {t(view, view)}
            <span className={cn('text-xs rounded-full px-1.5', activeView === view ? 'text-violet-500 font-bold' : 'text-muted-foreground/50')}>
              {counts[view]}
            </span>
            {activeView === view && (
              <motion.div layoutId="todo-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">{lang === 'vi' ? 'Due date:' : 'Due date:'}</span>
        <input
          type="date"
          value={dueDateFrom}
          onChange={(e) => setDueDateFrom(e.target.value)}
          className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        />
        <span className="text-xs text-muted-foreground">→</span>
        <input
          type="date"
          value={dueDateTo}
          onChange={(e) => setDueDateTo(e.target.value)}
          className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        />
        {(dueDateFrom || dueDateTo) && (
          <button
            onClick={() => { setDueDateFrom(''); setDueDateTo('') }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕ {lang === 'vi' ? 'Xóa' : 'Clear'}
          </button>
        )}
      </div>

      {/* Todo list */}
      {loading ? (
        <div className="space-y-2">{Array.from({length: 4}).map((_, i) => (
          <div key={i} className="h-14 rounded-xl border border-border bg-muted/20 animate-pulse" />
        ))}</div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground">{t('No tasks here. Add one above!', 'Khong co viec nao. Them o tren!')}</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((todo, i) => {
              const statusCfg   = STATUS_CONFIG[todo.status   as keyof typeof STATUS_CONFIG]   ?? STATUS_CONFIG['Todo']
              const priorityCfg = PRIORITY_CONFIG[todo.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG['Medium']
              const StatusIcon  = statusCfg.icon
              const isEditing   = editId === todo.id
              const isDone      = todo.status === 'Done'

              return (
                <motion.div key={todo.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}>
                  <GlassCard className={cn('overflow-hidden', isDone && 'opacity-60')}>
                    {!isEditing ? (
                      <div className="flex items-center gap-3 px-4 py-3 group">
                        {/* Status toggle */}
                        <button onClick={() => {
                          const next = isDone ? 'Todo' : 'Done'
                          updateStatus(todo.id, next)
                        }} className="flex-shrink-0">
                          <StatusIcon className={cn('h-4 w-4 transition-colors', statusCfg.color)} />
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium truncate', isDone && 'line-through text-muted-foreground')}>
                            {todo.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={cn('text-[10px] font-bold flex items-center gap-1', priorityCfg.color)}>
                              <span className={cn('h-1.5 w-1.5 rounded-full', priorityCfg.dot)} />
                              {todo.priority}
                            </span>
                            {todo.project_name && (
                              <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">{todo.project_name}</span>
                            )}
                            {todo.linked_bug && (
                              <span className="text-[10px] text-red-500 bg-red-500/10 rounded px-1.5 py-0.5">{todo.linked_bug}</span>
                            )}
                            {todo.due_date && (
                              <span className={cn('text-[10px]', todo.due_date < today ? 'text-red-500' : 'text-muted-foreground')}>
                                {todo.due_date < today ? '⚠ ' : ''}{todo.due_date}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status badge — click to cycle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const next = STATUSES[(STATUSES.indexOf(todo.status) + 1) % STATUSES.length]
                            updateStatus(todo.id, next)
                          }}
                          title="Click to change status"
                          className={cn('text-[10px] font-bold rounded-full px-2.5 py-1 flex-shrink-0 transition-opacity hover:opacity-70 border', statusCfg.bg, statusCfg.color)}>
                          {statusCfg.label}
                        </button>

                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => { setEditId(todo.id); setEditData({ title: todo.title, priority: todo.priority, due_date: todo.due_date, notes: todo.notes, linked_bug: todo.linked_bug, project_name: todo.project_name }) }}
                            className="rounded p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => deleteTodo(todo.id)}
                            className="rounded p-1 text-muted-foreground/40 hover:text-red-500 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Edit form */
                      <div className="px-4 py-3 space-y-3 bg-muted/20">
                        <input value={editData.title ?? ''} onChange={(e) => setEditData((d) => ({ ...d, title: e.target.value }))}
                          className={inputCls} placeholder="Title" />
                        <div className="grid grid-cols-2 gap-2">
                          <select value={editData.priority ?? 'Medium'} onChange={(e) => setEditData((d) => ({ ...d, priority: e.target.value }))}
                            className={inputCls}>
                            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <input type="date" value={editData.due_date ?? ''} onChange={(e) => setEditData((d) => ({ ...d, due_date: e.target.value }))}
                            className={inputCls} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input value={editData.project_name ?? ''} onChange={(e) => setEditData((d) => ({ ...d, project_name: e.target.value }))}
                            className={inputCls} placeholder="Project" />
                          <input value={editData.linked_bug ?? ''} onChange={(e) => setEditData((d) => ({ ...d, linked_bug: e.target.value }))}
                            className={inputCls} placeholder="Bug ID" />
                        </div>
                        <input value={editData.notes ?? ''} onChange={(e) => setEditData((d) => ({ ...d, notes: e.target.value }))}
                          className={inputCls} placeholder="Notes..." />
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(todo.id)} className="flex items-center gap-1.5 rounded-lg bg-violet-600 text-white px-3 py-1.5 text-xs hover:bg-violet-500 transition-colors">
                            <Save className="h-3 w-3" /> {t('Save', 'Luu')}
                          </button>
                          <button onClick={() => setEditId(null)} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted transition-colors">
                            <X className="h-3 w-3" /> {t('Cancel', 'Huy')}
                          </button>
                        </div>
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
