'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Globe, FileText, Bug, Zap, Flame } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api-client'
import { useLang } from '@/stores/language-store'
import { GlowButton } from '@/components/ui/glow-button'
import { cn } from '@/lib/utils'

const scanSchema = z.object({
  url: z.string().url('Please enter a valid URL (include https://)').max(2048),
  requirements: z.string().max(2000).optional(),
  mode: z.enum(['full', 'bug_hunt', 'test_case_only']).default('full'),
  roast_mode: z.boolean().default(false),
})
type ScanFormData = z.infer<typeof scanSchema>

const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/60 focus:border-violet-500/50 transition-all'

export function ScanForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { lang } = useLang()

  const modes = [
    {
      value: 'full',
      icon: Zap,
      label: lang === 'vi' ? 'Phân tích toàn diện' : 'Full Analysis',
      desc:  lang === 'vi' ? 'Tìm lỗi + test case + script' : 'Bug hunt + test cases + automation script',
      active: 'border-violet-500/60 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300',
    },
    {
      value: 'bug_hunt',
      icon: Bug,
      label: lang === 'vi' ? 'Chỉ tìm lỗi' : 'Bug Hunt Only',
      desc:  lang === 'vi' ? 'Tập trung vào UI/UX issues' : 'Focus on finding UI/UX issues',
      active: 'border-red-400/60 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300',
    },
    {
      value: 'test_case_only',
      icon: FileText,
      label: lang === 'vi' ? 'Chỉ tạo test case' : 'Test Cases Only',
      desc:  lang === 'vi' ? 'Sinh test case chuẩn QA' : 'Generate structured QA test cases',
      active: 'border-blue-400/60 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300',
    },
  ]

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ScanFormData>({
    resolver: zodResolver(scanSchema),
    defaultValues: { mode: 'full', roast_mode: false },
  })

  const selectedMode = watch('mode')
  const roastMode = watch('roast_mode')

  async function onSubmit(data: ScanFormData) {
    setLoading(true)
    try {
      const result = await apiClient.post<{ job_id: string }>('/api/scan', data)
      toast.success(lang === 'vi' ? 'Đã bắt đầu quét!' : 'Scan started!')
      router.push(`/scan/${result.job_id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start scan')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* URL */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
          {lang === 'vi' ? 'URL Website' : 'Target URL'} *
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-500" />
          <input
            {...register('url')}
            type="url"
            placeholder="https://example.com"
            className={cn(inputCls, 'pl-10 font-mono')}
          />
        </div>
        {errors.url && <p className="text-red-500 text-xs">{errors.url.message}</p>}
        <p className="text-xs text-muted-foreground/60">
          {lang === 'vi' ? 'Chỉ URL công khai. Localhost bị chặn vì bảo mật.' : 'Public URLs only. Localhost and internal IPs are blocked.'}
        </p>
      </div>

      {/* Requirements */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
          {lang === 'vi' ? 'Yêu cầu / Ngữ cảnh' : 'Requirements / Context'}
          <span className="ml-2 text-muted-foreground/50 normal-case font-normal tracking-normal">
            ({lang === 'vi' ? 'không bắt buộc' : 'optional'})
          </span>
        </label>
        <textarea
          {...register('requirements')}
          rows={3}
          placeholder={lang === 'vi' ? 'Mô tả trang này làm gì, luồng user cần test...' : 'Describe what this page should do, user flows to test...'}
          className={cn(inputCls, 'resize-none')}
        />
      </div>

      {/* Mode */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
          {lang === 'vi' ? 'Chế độ phân tích' : 'Analysis Mode'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {modes.map((m) => {
            const isActive = selectedMode === m.value
            return (
              <motion.button
                key={m.value}
                type="button"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => setValue('mode', m.value as ScanFormData['mode'])}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all',
                  isActive
                    ? m.active
                    : 'border-border bg-card text-muted-foreground hover:bg-muted hover:border-border/80'
                )}
              >
                <m.icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', isActive ? '' : 'opacity-40')} />
                <div>
                  <p className="text-sm font-semibold leading-none mb-1">{m.label}</p>
                  <p className="text-xs opacity-70 leading-relaxed">{m.desc}</p>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Roast mode */}
      <div className={cn(
        'flex items-center justify-between rounded-xl border p-4 transition-all',
        roastMode
          ? 'border-orange-300 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-500/5'
          : 'border-border bg-card'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center transition-all', roastMode ? 'bg-orange-100 dark:bg-orange-500/20' : 'bg-muted')}>
            <Flame className={cn('h-4 w-4 transition-colors', roastMode ? 'text-orange-500' : 'text-muted-foreground')} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{lang === 'vi' ? 'Chế độ Roast 🔥' : 'Roast Mode 🔥'}</p>
            <p className="text-xs text-muted-foreground">{lang === 'vi' ? 'AI nhận xét gay gắt nhưng hữu ích về UX' : 'Savage but constructive UX feedback'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setValue('roast_mode', !roastMode)}
          className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0', roastMode ? 'bg-orange-500' : 'bg-muted-foreground/20')}
        >
          <motion.span
            animate={{ x: roastMode ? 16 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="inline-block h-4 w-4 rounded-full bg-white shadow"
          />
        </button>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-1">
        <GlowButton type="submit" loading={loading} size="lg" icon={<Zap className="h-4 w-4" />} className="px-8">
          {loading
            ? (lang === 'vi' ? 'Đang khởi động...' : 'Starting scan...')
            : (lang === 'vi' ? 'Bắt đầu quét AI' : 'Launch AI Scan')}
        </GlowButton>
      </div>
    </form>
  )
}
