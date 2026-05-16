'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '@/lib/api-client'
import Link from 'next/link'
import { toast } from 'sonner'
import { useLang } from '@/stores/language-store'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { AIStatusPill } from '@/components/ui/ai-status-pill'
import { AIActivityFeed } from '@/components/ui/ai-activity-feed'

interface ScanJob {
  id: string
  url: string
  status: string
  error_msg?: string
  requirements?: string
  mode?: string
  roast_mode?: boolean
}

const STEPS = [
  'Connecting to website',
  'Taking screenshots',
  'Analyzing UI with AI',
  'Generating test cases',
  'Writing bug reports',
  'Creating automation script',
  'Finalizing report',
]

const ACTIVITY_LINES = [
  { type: 'info' as const,    message: 'Initializing browser context...' },
  { type: 'info' as const,    message: 'Navigating to target URL' },
  { type: 'ai' as const,      message: 'Capturing full-page screenshot' },
  { type: 'ai' as const,      message: 'Extracting DOM structure and metadata' },
  { type: 'info' as const,    message: 'Running accessibility audit (axe-core)' },
  { type: 'warn' as const,    message: 'Potential contrast ratio violation detected' },
  { type: 'ai' as const,      message: 'Sending screenshot to vision model...' },
  { type: 'ai' as const,      message: 'Analyzing layout, typography, and usability' },
  { type: 'warn' as const,    message: 'Missing alt attributes on images' },
  { type: 'ai' as const,      message: 'Generating structured test cases...' },
  { type: 'ai' as const,      message: 'Writing bug reports with severity ratings' },
  { type: 'ai' as const,      message: 'Creating Playwright automation script' },
  { type: 'success' as const, message: 'Analysis complete — building final report' },
]

export function ScanProgress({ job }: { job: ScanJob }) {
  const router = useRouter()
  const { lang } = useLang()
  const [currentStep, setCurrentStep] = useState(0)
  const [failed, setFailed] = useState(job.status === 'failed')
  const [errorMsg, setErrorMsg] = useState(job.error_msg ?? '')
  const [retrying, setRetrying] = useState(false)

  async function handleRetry() {
    setRetrying(true)
    try {
      const result = await apiClient.post<{ job_id: string }>('/api/scan', {
        url: job.url,
        requirements: job.requirements,
        mode: job.mode ?? 'full',
        roast_mode: job.roast_mode ?? false,
      })
      toast.success('Scan restarted!')
      router.push(`/scan/${result.job_id}`)
    } catch {
      toast.error('Failed to retry')
      setRetrying(false)
    }
  }

  useEffect(() => {
    if (job.status === 'completed') { router.refresh(); return }
    if (job.status === 'failed') { setFailed(true); return }

    const poll = setInterval(async () => {
      try {
        const data = await apiClient.get<{ status: string; error_msg?: string; progress_step?: number }>(`/api/scan/${job.id}`)
        if (data.progress_step !== undefined) setCurrentStep(data.progress_step)
        if (data.status === 'completed') { setCurrentStep(7); clearInterval(poll); router.refresh() }
        if (data.status === 'failed') { setFailed(true); setErrorMsg(data.error_msg ?? ''); clearInterval(poll) }
      } catch { /* keep polling */ }
    }, 3000)

    return () => clearInterval(poll)
  }, [job.id, job.status, router])

  if (failed) {
    return (
      <GlassCard className="p-8 border border-red-500/20 bg-red-500/5">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold mb-2">{lang === 'vi' ? 'Quét thất bại' : 'Scan failed'}</h2>
            {errorMsg && (
              <p className="text-sm text-white/40 font-mono bg-black/20 rounded-lg p-3 text-left max-w-sm mx-auto">
                {errorMsg.length > 200 ? errorMsg.slice(0, 200) + '...' : errorMsg}
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <GlowButton onClick={handleRetry} loading={retrying} icon={<RefreshCw className="h-4 w-4" />}>
              {lang === 'vi' ? 'Thử lại' : 'Retry scan'}
            </GlowButton>
            <Link href="/scan/new">
              <GlowButton variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                {lang === 'vi' ? 'Quét mới' : 'New scan'}
              </GlowButton>
            </Link>
          </div>
        </div>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status header */}
      <GlassCard className="p-5 border border-violet-500/20 bg-violet-500/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="h-5 w-5 text-violet-400" />
              </motion.div>
            </div>
            <div>
              <p className="font-semibold">{lang === 'vi' ? 'Đang quét...' : 'Scanning in progress'}</p>
              <p className="text-xs text-white/40 font-mono mt-0.5 truncate max-w-xs">{job.url}</p>
            </div>
          </div>
          <AIStatusPill status="scanning" />
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.max(5, (currentStep / STEPS.length) * 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <p className="text-xs text-white/40">{STEPS[currentStep] ?? 'Processing...'}</p>
          <p className="text-xs text-white/40 font-mono">{currentStep}/{STEPS.length}</p>
        </div>
      </GlassCard>

      {/* Steps */}
      <GlassCard className="p-5">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Pipeline</p>
        <div className="space-y-2">
          {STEPS.map((step, i) => {
            const done = i < currentStep
            const active = i === currentStep
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3"
              >
                <div className="flex-shrink-0">
                  {done && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  {active && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="h-4 w-4 rounded-full border-2 border-violet-400 border-t-transparent"
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                  )}
                  {!done && !active && <div className="h-4 w-4 rounded-full border border-white/10" />}
                </div>
                <span className={`text-sm ${done ? 'text-white/30 line-through' : active ? 'text-white font-medium' : 'text-white/20'}`}>
                  {step}
                </span>
              </motion.div>
            )
          })}
        </div>
      </GlassCard>

      {/* AI Activity Feed */}
      <GlassCard className="p-5 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest">AI Activity Log</p>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-mono">LIVE</span>
          </div>
        </div>
        <div className="bg-black/30 rounded-lg p-3">
          <AIActivityFeed lines={ACTIVITY_LINES} maxLines={8} />
        </div>
      </GlassCard>
    </div>
  )
}
