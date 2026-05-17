'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Pin, Trash2, Tag, BookOpen, Sparkles, X, Save, Edit3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { cn } from '@/lib/utils'
import { useLang } from '@/stores/language-store'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  pinned: boolean
  created_at: string
  updated_at: string
}

const TAG_COLORS: Record<string, string> = {
  accessibility: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  api:           'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  ui:            'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  interview:     'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  bug:           'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  automation:    'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
}

function TagPill({ tag }: { tag: string }) {
  const cls = TAG_COLORS[tag.toLowerCase()] ?? 'bg-muted text-muted-foreground'
  return <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', cls)}>{tag}</span>
}

export function NotesClient() {
  const { lang } = useLang()
  const [notes, setNotes] = useState<Note[]>([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Note | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ title: '', content: '', tags: '' })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchNotes() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('qa_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false })
    setNotes(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchNotes() }, [])

  async function saveNote() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !draft.title.trim()) { toast.error(lang === 'vi' ? 'Vui lòng nhập tiêu đề ghi chú.' : 'Note title is required.'); return }
    const tags = draft.tags.split(',').map((t) => t.trim()).filter(Boolean)
    const now = new Date().toISOString()

    if (editing) {
      await supabase.from('qa_notes').update({
        title: draft.title, content: draft.content, tags, updated_at: now,
      }).eq('id', editing.id)
      toast.success('Note updated')
    } else {
      await supabase.from('qa_notes').insert({
        user_id: user.id, title: draft.title, content: draft.content,
        tags, pinned: false, created_at: now, updated_at: now,
      })
      toast.success('Note created')
    }
    setEditing(null); setCreating(false)
    setDraft({ title: '', content: '', tags: '' })
    fetchNotes()
  }

  async function deleteNote(id: string) {
    await supabase.from('qa_notes').delete().eq('id', id)
    setNotes((n) => n.filter((x) => x.id !== id))
    toast.success('Deleted')
  }

  async function togglePin(note: Note) {
    await supabase.from('qa_notes').update({ pinned: !note.pinned }).eq('id', note.id)
    fetchNotes()
  }

  function openCreate() {
    setDraft({ title: '', content: '', tags: '' })
    setEditing(null)
    setCreating(true)
  }

  function openEdit(note: Note) {
    setDraft({ title: note.title, content: note.content, tags: note.tags.join(', ') })
    setEditing(note)
    setCreating(true)
  }

  const filtered = notes.filter(
    (n) => n.title.toLowerCase().includes(search.toLowerCase()) ||
           n.content.toLowerCase().includes(search.toLowerCase()) ||
           n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  )
  const pinned = filtered.filter((n) => n.pinned)
  const unpinned = filtered.filter((n) => !n.pinned)

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-5 w-5 text-violet-500" />
            <h1 className="text-2xl font-bold">{t('QA Notes', 'Ghi Chú QA')}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('Your personal testing journal', 'Nhật ký kiểm thử cá nhân của bạn')}
          </p>
        </div>
        <GlowButton onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
          {t('New Note', 'Ghi chú mới')}
        </GlowButton>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Search notes...', 'Tìm ghi chú...')}
          className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        />
      </div>

      {/* Note Editor Modal */}
      <AnimatePresence>
        {creating && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setCreating(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-2xl rounded-2xl border border-border dark:border-white/10 bg-card dark:bg-[#0d0d12]/98 backdrop-blur-xl shadow-[0_25px_80px_rgba(0,0,0,0.4)] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">{editing ? t('Edit Note', 'Sửa ghi chú') : t('New Note', 'Ghi chú mới')}</h2>
                  <button onClick={() => setCreating(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <input
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder={t('Note title...', 'Tiêu đề ghi chú...')}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base font-semibold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />

                <textarea
                  value={draft.content}
                  onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                  placeholder={t('Write your notes, insights, lessons learned... (Markdown supported)', 'Viết ghi chú, bài học, kiến thức... (hỗ trợ Markdown)')}
                  rows={10}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none font-mono"
                />

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <label className="text-xs text-muted-foreground font-medium">{t('Tags (comma separated)', 'Tags (phân cách bằng dấu phẩy)')}</label>
                  </div>
                  <input
                    value={draft.tags}
                    onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
                    placeholder="accessibility, api, interview, bug..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <GlowButton variant="secondary" onClick={() => setCreating(false)}>
                    {t('Cancel', 'Hủy')}
                  </GlowButton>
                  <GlowButton onClick={saveNote} icon={<Save className="h-4 w-4" />}>
                    {t('Save note', 'Lưu ghi chú')}
                  </GlowButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!loading && notes.length === 0 && (
        <GlassCard className="p-16 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="font-medium text-muted-foreground">{t('No notes yet', 'Chưa có ghi chú nào')}</p>
          <p className="text-sm text-muted-foreground/50 mt-1 mb-4">
            {t('Start your QA journal — save lessons, patterns, and insights.', 'Bắt đầu nhật ký QA — lưu bài học, pattern và kiến thức.')}
          </p>
          <GlowButton onClick={openCreate} icon={<Plus className="h-4 w-4" />}>
            {t('Create first note', 'Tạo ghi chú đầu tiên')}
          </GlowButton>
        </GlassCard>
      )}

      {/* Pinned */}
      {pinned.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Pin className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('Pinned', 'Đã ghim')}</span>
          </div>
          <NoteGrid notes={pinned} onEdit={openEdit} onDelete={deleteNote} onPin={togglePin} lang={lang} />
        </div>
      )}

      {/* All notes */}
      {unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('All Notes', 'Tất cả')}</span>
            </div>
          )}
          <NoteGrid notes={unpinned} onEdit={openEdit} onDelete={deleteNote} onPin={togglePin} lang={lang} />
        </div>
      )}
    </div>
  )
}

function NoteGrid({ notes, onEdit, onDelete, onPin, lang }: {
  notes: Note[]
  onEdit: (n: Note) => void
  onDelete: (id: string) => void
  onPin: (n: Note) => void
  lang: string
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {notes.map((note, i) => (
        <motion.div
          key={note.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <GlassCard hover className="p-4 h-full flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm leading-snug flex-1">{note.title}</h3>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => onPin(note)} className={cn('rounded p-1 transition-colors', note.pinned ? 'text-violet-500' : 'text-muted-foreground/40 hover:text-muted-foreground')}>
                  <Pin className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onEdit(note)} className="rounded p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onDelete(note.id)} className="rounded p-1 text-muted-foreground/40 hover:text-red-500 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {note.content && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                {note.content}
              </p>
            )}

            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {note.tags.map((tag) => <TagPill key={tag} tag={tag} />)}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground/40 font-mono">
              {new Date(note.updated_at).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
            </p>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  )
}
