'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface ScanJob {
  id: string
  url: string
  status: string
  error_msg?: string
}

interface ProgressStep {
  label: string
  status: 'pending' | 'active' | 'done' | 'error'
}

const STEP_LABELS = [
  'Connecting to website',
  'Taking screenshots',
  'Analyzing UI with AI',
  'Generating test cases',
  'Writing bug reports',
  'Creating automation script',
  'Finalizing report',
]

export function ScanProgress({ job }: { job: ScanJob }) {
  const router = useRouter()
  const [steps, setSteps] = useState<ProgressStep[]>(
    STEP_LABELS.map((label, i) => ({
      label,
      status: i === 0 ? 'active' : 'pending',
    }))
  )
  const [failed, setFailed] = useState(job.status === 'failed')

  useEffect(() => {
    if (job.status === 'completed') {
      router.refresh()
      return
    }
    if (job.status === 'failed') {
      setFailed(true)
      return
    }

    // SSE for real-time updates
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
    const es = new EventSource(`${apiUrl}/api/scan/${job.id}/stream`)

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.step !== undefined) {
          setSteps((prev) =>
            prev.map((s, i) => ({
              ...s,
              status:
                i < data.step ? 'done' : i === data.step ? 'active' : 'pending',
            }))
          )
        }
        if (data.status === 'completed') {
          setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })))
          es.close()
          router.refresh()
        }
        if (data.status === 'failed') {
          setFailed(true)
          es.close()
        }
      } catch {
        // ignore parse errors
      }
    }

    // Fallback polling every 3s if SSE unavailable
    const poll = setInterval(async () => {
      const res = await fetch(`${apiUrl}/api/scan/${job.id}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const d = await res.json()
        if (d.status === 'completed' || d.status === 'failed') {
          clearInterval(poll)
          router.refresh()
        }
      }
    }, 3000)

    return () => {
      es.close()
      clearInterval(poll)
    }
  }, [job.id, job.status, router])

  if (failed) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
        <h2 className="text-lg font-semibold mb-1">Scan failed</h2>
        <p className="text-sm text-muted-foreground">{job.error_msg ?? 'An unexpected error occurred.'}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-8 space-y-6">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
        <h2 className="text-lg font-semibold">Scanning in progress</h2>
        <p className="text-sm text-muted-foreground mt-1 font-mono">{job.url}</p>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {step.status === 'done' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {step.status === 'active' && (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              {step.status === 'pending' && (
                <div className="h-5 w-5 rounded-full border-2 border-muted" />
              )}
            </div>
            <span
              className={`text-sm ${
                step.status === 'done'
                  ? 'text-muted-foreground line-through'
                  : step.status === 'active'
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground/50'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
