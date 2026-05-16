'use client'

import { useState } from 'react'
import { Bug, Trophy, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useLang } from '@/stores/language-store'

interface Challenge {
  id: string
  title: { en: string; vi: string }
  description: { en: string; vi: string }
  difficulty: 'easy' | 'medium' | 'hard'
  url: string
  bugCount: number
}

interface BugReport {
  title: string
  description: string
}

const CHALLENGES: Challenge[] = [
  {
    id: 'ch1',
    title:       { en: 'Broken Login Form',       vi: 'Form Đăng Nhập Lỗi' },
    description: { en: 'A login page with several UI and functional bugs. Find them all!', vi: 'Trang đăng nhập có nhiều lỗi UI và chức năng. Tìm hết đi!' },
    difficulty: 'easy',
    url: '/demo-site/login-buggy.html',
    bugCount: 5,
  },
  {
    id: 'ch2',
    title:       { en: 'E-commerce Cart Chaos',   vi: 'Giỏ Hàng Hỗn Loạn' },
    description: { en: 'A shopping cart with calculation errors and UX problems.', vi: 'Giỏ hàng có lỗi tính toán và vấn đề UX.' },
    difficulty: 'medium',
    url: '/demo-site/cart-buggy.html',
    bugCount: 8,
  },
  {
    id: 'ch3',
    title:       { en: 'Dashboard Disaster',      vi: 'Dashboard Thảm Họa' },
    description: { en: 'An analytics dashboard with data display and accessibility issues.', vi: 'Dashboard có lỗi hiển thị dữ liệu và accessibility.' },
    difficulty: 'hard',
    url: '/demo-site/dashboard-buggy.html',
    bugCount: 12,
  },
]

const difficultyColors = {
  easy:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  hard:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const difficultyLabels = {
  en: { easy: 'easy', medium: 'medium', hard: 'hard' },
  vi: { easy: 'dễ',  medium: 'trung bình', hard: 'khó' },
}

export function GameArena() {
  const { t, lang } = useLang()
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [bugReports, setBugReports] = useState<BugReport[]>([])
  const [newBug, setNewBug] = useState({ title: '', description: '' })
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  function startChallenge(challenge: Challenge) {
    setSelectedChallenge(challenge)
    setBugReports([])
    setSubmitted(false)
    setScore(null)
  }

  function addBug() {
    if (!newBug.title.trim()) {
      toast.error(lang === 'vi' ? 'Nhập tên bug trước' : 'Bug title is required')
      return
    }
    setBugReports((prev) => [...prev, { ...newBug }])
    setNewBug({ title: '', description: '' })
    toast.success(lang === 'vi' ? 'Đã báo bug!' : 'Bug reported!')
  }

  function submitSession() {
    if (bugReports.length === 0) {
      toast.error(lang === 'vi' ? 'Báo ít nhất 1 bug trước' : 'Report at least one bug first')
      return
    }
    const found = Math.min(bugReports.length, selectedChallenge!.bugCount)
    setScore(Math.round((found / selectedChallenge!.bugCount) * 100))
    setSubmitted(true)
  }

  if (submitted && score !== null) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <Trophy className={`h-16 w-16 mx-auto ${score >= 80 ? 'text-yellow-400' : score >= 50 ? 'text-gray-400' : 'text-orange-400'}`} />
        <div>
          <p className="text-3xl font-bold">{score}%</p>
          <p className="text-muted-foreground mt-1">
            {lang === 'vi'
              ? `Bạn báo ${bugReports.length} bug trên tổng ${selectedChallenge!.bugCount} bug`
              : `You reported ${bugReports.length} bugs out of ${selectedChallenge!.bugCount} total`}
          </p>
        </div>
        <div className="text-left rounded-lg border border-border p-4 space-y-2">
          <p className="text-sm font-medium">{lang === 'vi' ? 'Bug bạn tìm được:' : 'Your reports:'}</p>
          {bugReports.map((b, i) => (
            <div key={i} className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{b.title}</span>
              {b.description && ` — ${b.description}`}
            </div>
          ))}
        </div>
        <button
          onClick={() => setSelectedChallenge(null)}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
        >
          {lang === 'vi' ? 'Thử thách khác' : 'Try another challenge'}
        </button>
      </div>
    )
  }

  if (selectedChallenge) {
    const title = selectedChallenge.title[lang]
    const description = selectedChallenge.description[lang]
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bug className="h-4 w-4" />
            {selectedChallenge.bugCount} {t('bugsToFind')}
          </div>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-muted-foreground font-mono ml-1">{title}</span>
          </div>
          <iframe src={selectedChallenge.url} className="w-full h-96 bg-white" title={title} />
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">
            {lang === 'vi' ? 'Báo bug bạn tìm được' : 'Report a bug you found'}
          </p>
          <input
            value={newBug.title}
            onChange={(e) => setNewBug((p) => ({ ...p, title: e.target.value }))}
            placeholder={lang === 'vi' ? "Tên bug (vd: 'Nút Submit không hoạt động')" : "Bug title (e.g. 'Submit button not working')"}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <textarea
            value={newBug.description}
            onChange={(e) => setNewBug((p) => ({ ...p, description: e.target.value }))}
            placeholder={lang === 'vi' ? 'Mô tả thêm... (không bắt buộc)' : 'Describe the bug... (optional)'}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
          />
          <button
            onClick={addBug}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
          >
            <Bug className="h-3.5 w-3.5" />
            {t('reportBug')}
          </button>
        </div>

        {bugReports.length > 0 && (
          <div className="rounded-xl border border-border p-4 space-y-2">
            <p className="text-sm font-medium">
              {lang === 'vi' ? `Bug đã báo (${bugReports.length})` : `Reported bugs (${bugReports.length})`}
            </p>
            {bugReports.map((b, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Bug className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{b.title}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={submitSession}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          <Trophy className="h-4 w-4" />
          {t('submitScore')}
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
      {CHALLENGES.map((challenge) => {
        const title = challenge.title[lang]
        const description = challenge.description[lang]
        return (
          <div key={challenge.id} className="flex flex-col rounded-xl border border-border bg-card p-5 gap-3">
            <div className="flex items-center justify-between">
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${difficultyColors[challenge.difficulty]}`}>
                {difficultyLabels[lang][challenge.difficulty]}
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Bug className="h-3.5 w-3.5" />
                {challenge.bugCount} {t('bugsToFind')}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            <button
              onClick={() => startChallenge(challenge)}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted hover:border-violet-300 dark:hover:border-violet-500/40 transition-colors mt-auto"
            >
              {t('startChallenge')}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
