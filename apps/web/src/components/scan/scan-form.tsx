'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Globe, FileText, Bug, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

const scanSchema = z.object({
  url: z
    .string()
    .url('Please enter a valid URL (include https://)')
    .max(2048, 'URL too long'),
  requirements: z.string().max(2000, 'Requirements too long').optional(),
  mode: z.enum(['full', 'bug_hunt', 'test_case_only']).default('full'),
  roast_mode: z.boolean().default(false),
})

type ScanFormData = z.infer<typeof scanSchema>

const modes = [
  {
    value: 'full',
    label: 'Full Analysis',
    description: 'Bug hunt + test cases + automation script',
    icon: Zap,
  },
  {
    value: 'bug_hunt',
    label: 'Bug Hunt Only',
    description: 'Focus on finding UI/UX issues',
    icon: Bug,
  },
  {
    value: 'test_case_only',
    label: 'Test Cases Only',
    description: 'Generate structured QA test cases',
    icon: FileText,
  },
]

export function ScanForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ScanFormData>({
    resolver: zodResolver(scanSchema),
    defaultValues: { mode: 'full', roast_mode: false },
  })

  const selectedMode = watch('mode')
  const roastMode = watch('roast_mode')

  async function onSubmit(data: ScanFormData) {
    setLoading(true)
    try {
      const result = await apiClient.post<{ job_id: string }>('/api/scan', data)
      toast.success('Scan started!')
      router.push(`/scan/${result.job_id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start scan'
      toast.error(msg)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* URL Input */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Website URL *</label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            {...register('url')}
            type="url"
            placeholder="https://example.com"
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {errors.url && <p className="text-destructive text-xs mt-1">{errors.url.message}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          Public URLs only. Localhost and internal IPs are blocked for security.
        </p>
      </div>

      {/* Requirements */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">
          Requirements / Context{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          {...register('requirements')}
          rows={4}
          placeholder="Describe what this page should do, user flows to test, or specific areas to focus on..."
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        {errors.requirements && (
          <p className="text-destructive text-xs mt-1">{errors.requirements.message}</p>
        )}
      </div>

      {/* Mode selector */}
      <div>
        <label className="text-sm font-medium mb-2 block">Analysis Mode</label>
        <div className="grid grid-cols-1 gap-2">
          {modes.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setValue('mode', m.value as ScanFormData['mode'])}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                selectedMode === m.value
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border hover:border-primary/40 hover:bg-muted/50'
              }`}
            >
              <m.icon
                className={`h-4 w-4 flex-shrink-0 ${
                  selectedMode === m.value ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <div>
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Roast mode toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-medium">Roast Mode 🔥</p>
          <p className="text-xs text-muted-foreground">
            AI gives savage but constructive UX feedback
          </p>
        </div>
        <button
          type="button"
          onClick={() => setValue('roast_mode', !roastMode)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            roastMode ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              roastMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Starting scan...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            Start AI Scan
          </>
        )}
      </button>
    </form>
  )
}
