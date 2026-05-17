'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, X, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { GlowButton } from '@/components/ui/glow-button'
import { GlassCard } from '@/components/ui/glass-card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  onClose: () => void
  onSuccess: () => void
  lang: string
}

interface PreviewResult {
  preview: Record<string, unknown>[]
  total: number
  warnings: string[]
  column_map: Record<string, string>
  filename: string
}

export function SuiteUploadPanel({ onClose, onSuccess, lang }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [suiteName, setSuiteName] = useState('')
  const [module, setModule] = useState('')
  const [dragging, setDragging] = useState(false)
  const [phase, setPhase] = useState<'upload' | 'preview' | 'importing'>('upload')
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }

  function pickFile(f: File) {
    setFile(f)
    if (!suiteName) setSuiteName(f.name.replace(/\.(xlsx|csv|xls)$/i, ''))
  }

  async function previewFile() {
    if (!file || !suiteName.trim()) {
      toast.error(t('Please select a file and enter a suite name.', 'Vui lòng chọn file và nhập tên suite.'))
      return
    }
    setPhase('importing')
    setErrors([])
    try {
      const sb = createClient()
      const { data: { session } } = await sb.auth.getSession()
      const form = new FormData()
      form.append('file', file)
      form.append('suite_name', suiteName)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/testcases/upload/preview`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: form,
      })
      if (!res.ok) {
        const err = await res.json()
        setErrors(err.detail?.errors ?? [err.detail ?? 'Unknown error'])
        setPhase('upload')
        return
      }
      const data: PreviewResult = await res.json()
      setPreview(data)
      setPhase('preview')
    } catch (e) {
      setErrors([e instanceof Error ? e.message : 'Failed to preview'])
      setPhase('upload')
    }
  }

  async function confirmImport() {
    if (!file || !suiteName.trim()) return
    setPhase('importing')
    try {
      const sb = createClient()
      const { data: { session } } = await sb.auth.getSession()
      const form = new FormData()
      form.append('file', file)
      form.append('suite_name', suiteName)
      if (module) form.append('module', module)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/testcases/upload/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: form,
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.detail?.errors?.[0] ?? 'Import failed')
        setPhase('preview')
        return
      }
      const data = await res.json()
      toast.success(t(`Imported ${data.total_imported} test cases!`, `Đã import ${data.total_imported} test case!`))
      onSuccess()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Import failed')
      setPhase('preview')
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <div className="w-full max-w-2xl rounded-2xl border border-border dark:border-white/10 bg-card dark:bg-[#0d0d12]/98 shadow-[0_25px_80px_rgba(0,0,0,0.5)] p-6 space-y-5 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">{t('Upload Test Cases', 'Upload Test Case')}</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>

          {phase === 'upload' && (
            <>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`rounded-xl border-2 border-dashed p-10 text-center transition-all ${dragging ? 'border-violet-500 bg-violet-500/5' : 'border-border hover:border-violet-500/50 hover:bg-muted/30'}`}
              >
                {file ? (
                  <div className="space-y-2">
                    <FileSpreadsheet className="h-10 w-10 text-emerald-500 mx-auto" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                    <button onClick={() => setFile(null)} className="text-xs text-red-500 hover:underline">{t('Remove', 'Xóa')}</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                    <div>
                      <p className="font-medium">{t('Drop your Excel or CSV file here', 'Kéo thả file Excel hoặc CSV vào đây')}</p>
                      <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls, .csv · Max 10MB</p>
                    </div>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm cursor-pointer hover:bg-muted transition-colors">
                      <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])} />
                      {t('Browse file', 'Chọn file')}
                    </label>
                  </div>
                )}
              </div>

              {/* Suite name + module */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                    {t('Suite Name *', 'Tên Suite *')}
                  </label>
                  <input value={suiteName} onChange={(e) => setSuiteName(e.target.value)}
                    placeholder={t('e.g. Login Test Cases v1', 'vd: Login Test Cases v1')}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                    {t('Module', 'Module')} <span className="font-normal text-muted-foreground/50 normal-case">({t('optional', 'không bắt buộc')})</span>
                  </label>
                  <input value={module} onChange={(e) => setModule(e.target.value)}
                    placeholder={t('e.g. Authentication', 'vd: Authentication')}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50" />
                </div>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5 p-3 space-y-1">
                  {errors.map((e, i) => (
                    <div key={i} className="flex gap-2 text-sm text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" /> {e}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <GlowButton variant="ghost" onClick={onClose}>{t('Cancel', 'Hủy')}</GlowButton>
                <GlowButton onClick={previewFile} disabled={!file} icon={<Upload className="h-4 w-4" />}>
                  {t('Preview & Validate', 'Xem trước & Kiểm tra')}
                </GlowButton>
              </div>
            </>
          )}

          {phase === 'importing' && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-violet-500 mx-auto" />
              <p className="text-muted-foreground">{t('Processing file...', 'Đang xử lý file...')}</p>
            </div>
          )}

          {phase === 'preview' && preview && (
            <>
              {/* Summary */}
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5 p-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{t('File looks good!', 'File hợp lệ!')}</p>
                  <p className="text-xs text-muted-foreground">{preview.total} {t('test cases found', 'test case tìm thấy')} · {Object.keys(preview.column_map).length} {t('columns mapped', 'cột đã map')}</p>
                </div>
              </div>

              {/* Warnings */}
              {preview.warnings.length > 0 && (
                <div className="rounded-xl border border-yellow-200 dark:border-yellow-500/30 bg-yellow-50 dark:bg-yellow-500/5 p-3 space-y-1 max-h-32 overflow-y-auto">
                  <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400 mb-1">{t('Warnings:', 'Cảnh báo:')}</p>
                  {preview.warnings.slice(0, 10).map((w, i) => (
                    <p key={i} className="text-xs text-yellow-700 dark:text-yellow-400">• {w}</p>
                  ))}
                  {preview.warnings.length > 10 && <p className="text-xs text-muted-foreground">+{preview.warnings.length - 10} more...</p>}
                </div>
              )}

              {/* Preview table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        {['tc_id', 'description', 'priority', 'status', 'expected_result'].map((col) => (
                          <th key={col} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-t border-border">
                          {['tc_id', 'description', 'priority', 'status', 'expected_result'].map((col) => (
                            <td key={col} className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">
                              {String((row as Record<string, unknown>)[col] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.total > 5 && (
                  <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                    +{preview.total - 5} {t('more rows', 'hàng nữa')}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <GlowButton variant="ghost" onClick={() => setPhase('upload')}>{t('Back', 'Quay lại')}</GlowButton>
                <GlowButton onClick={confirmImport} icon={<CheckCircle2 className="h-4 w-4" />}>
                  {t(`Import ${preview.total} cases`, `Import ${preview.total} test case`)}
                </GlowButton>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}
