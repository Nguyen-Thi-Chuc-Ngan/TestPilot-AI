'use client'

import { useState } from 'react'
import { Timer, Bug, Trophy, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface Challenge {
  id: string
  title: string
  description: string
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
    title: 'Broken Login Form',
    description: 'A login page with several UI and functional bugs. Find them all!',
    difficulty: 'easy',
    url: '/demo-site/login-buggy.html',
    bugCount: 5,
  },
  {
    id: 'ch2',
    title: 'E-commerce Cart Chaos',
    description: 'A shopping cart with calculation errors and UX problems.',
    difficulty: 'medium',
    url: '/demo-site/cart-buggy.html',
    bugCount: 8,
  },
  {
    id: 'ch3',
    title: 'Dashboard Disaster',
    description: 'An analytics dashboard with data display and accessibility issues.',
    difficulty: 'hard',
    url: '/demo-site/dashboard-buggy.html',
    bugCount: 12,
  },
]

const difficultyColors = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

export function GameArena() {
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
      toast.error('Bug title is required')
      return
    }
    setBugReports((prev) => [...prev, { ...newBug }])
    setNewBug({ title: '', description: '' })
    toast.success('Bug reported!')
  }

  function submitSession() {
    if (bugReports.length === 0) {
      toast.error('Report at least one bug first')
      return
    }
    // Score based on number of bugs found vs total
    const found = Math.min(bugReports.length, selectedChallenge!.bugCount)
    const calculatedScore = Math.round((found / selectedChallenge!.bugCount) * 100)
    setScore(calculatedScore)
    setSubmitted(true)
  }

  if (submitted && score !== null) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <Trophy className={`h-16 w-16 mx-auto ${score >= 80 ? 'text-yellow-400' : score >= 50 ? 'text-gray-400' : 'text-orange-400'}`} />
        <div>
          <p className="text-3xl font-bold">{score}%</p>
          <p className="text-muted-foreground mt-1">
            You reported {bugReports.length} bugs out of {selectedChallenge!.bugCount} total
          </p>
        </div>
        <div className="text-left rounded-lg border border-border p-4 space-y-2">
          <p className="text-sm font-medium">Your reports:</p>
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
          Try another challenge
        </button>
      </div>
    )
  }

  if (selectedChallenge) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{selectedChallenge.title}</h2>
            <p className="text-sm text-muted-foreground">{selectedChallenge.description}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bug className="h-4 w-4" />
            {selectedChallenge.bugCount} bugs to find
          </div>
        </div>

        {/* App iframe */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-muted-foreground font-mono ml-1">
              {selectedChallenge.title}
            </span>
          </div>
          <iframe
            src={selectedChallenge.url}
            className="w-full h-96 bg-white"
            title={selectedChallenge.title}
          />
        </div>

        {/* Bug reporting */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Report a bug you found</p>
          <input
            value={newBug.title}
            onChange={(e) => setNewBug((p) => ({ ...p, title: e.target.value }))}
            placeholder="Bug title (e.g. 'Submit button not working')"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            value={newBug.description}
            onChange={(e) => setNewBug((p) => ({ ...p, description: e.target.value }))}
            placeholder="Describe the bug... (optional)"
            rows={2}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <button
            onClick={addBug}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
          >
            <Bug className="h-3.5 w-3.5" />
            Add bug report
          </button>
        </div>

        {bugReports.length > 0 && (
          <div className="rounded-xl border border-border p-4 space-y-2">
            <p className="text-sm font-medium">
              Reported bugs ({bugReports.length})
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
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Trophy className="h-4 w-4" />
          Submit & See Score
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {CHALLENGES.map((challenge) => (
        <div key={challenge.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${difficultyColors[challenge.difficulty]}`}
            >
              {challenge.difficulty}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Bug className="h-3.5 w-3.5" />
              {challenge.bugCount} bugs
            </div>
          </div>
          <div>
            <h3 className="font-semibold">{challenge.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
          </div>
          <button
            onClick={() => startChallenge(challenge)}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted hover:border-primary/40 transition-colors"
          >
            Start challenge
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
