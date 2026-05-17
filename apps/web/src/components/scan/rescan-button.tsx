'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { useLang } from '@/stores/language-store'
import { translateError } from '@/lib/error-messages'

interface Props {
  job: {
    url: string
    requirements?: string
    mode?: string
    roast_mode?: boolean
  }
}

export function RescanButton({ job }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { lang } = useLang()

  async function handleRescan() {
    setLoading(true)
    try {
      const result = await apiClient.post<{ job_id: string }>('/api/scan', {
        url: job.url,
        requirements: job.requirements,
        mode: job.mode ?? 'full',
        roast_mode: job.roast_mode ?? false,
      })
      toast.success(lang === 'vi' ? 'Đã bắt đầu quét lại!' : 'Re-scan started!')
      router.push(`/scan/${result.job_id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start re-scan'
      toast.error(translateError(msg, lang as 'en' | 'vi'))
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRescan}
      disabled={loading}
      className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      {loading
        ? (lang === 'vi' ? 'Đang khởi động...' : 'Starting...')
        : (lang === 'vi' ? 'Quét lại' : 'Re-scan')}
    </button>
  )
}
