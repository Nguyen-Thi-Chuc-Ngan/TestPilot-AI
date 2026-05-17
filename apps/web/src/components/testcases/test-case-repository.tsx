'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Database, Search, Download, Brain, Sparkles, Trash2, RotateCcw, FileSpreadsheet, Filter, AlertTriangle } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { useLang } from '@/stores/language-store'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { translateError } from '@/lib/error-messages'
import { SuiteUploadPanel } from './suite-upload-panel'
import { ExecutionTable, QA_STATUS_CONFIG } from './execution-table'
import { DetailDrawer } from './detail-drawer'
import { AIAnalysisPanel } from './ai-analysis-panel'
import { cn } from '@/lib/utils'

interface Suite {
  id: string
  name: string
  module?: string
  total_cases: number
  created_at: string
  original_file?: string
  client?: string
  sprint?: string
  environment?: string
  platform?: string
  release_version?: string
  qa_owner?: string
}

export function TestCaseRepository() {
  const { lang } = useLang()
  const [suites, setSuites] = useState<Suite[]>([])
  const [selectedSuite, setSelectedSuite] = useState<Suite | null>(null)
  const [cases, setCases] = useState<Record<string, unknown>[]>([])
  const [selectedTC, setSelectedTC] = useState<Record<string, unknown> | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null)
  const [loadingSuites, setLoadingSuites] = useState(false)
  const [loadingCases, setLoadingCases] = useState(false)
  const [analyzingAI, setAnalyzingAI] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [suiteSearch, setSuiteSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'failed' | 'retest' | 'passed'>('all')

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  async function loadSuites() {
    setLoadingSuites(true)
    try {
      const data = await apiClient.get<Suite[]>('/api/testcases/suites')
      setSuites(data)
    } catch (err) {
      toast.error(translateError(err instanceof Error ? err.message : '', lang as 'en' | 'vi'))
    } finally { setLoadingSuites(false) }
  }

  async function selectSuite(suite: Suite) {
    setSelectedSuite(suite)
    setSelectedTC(null)
    setShowAnalysis(false)
    setLoadingCases(true)
    try {
      const data = await apiClient.get<{ suite: Suite; cases: Record<string, unknown>[] }>(`/api/testcases/suites/${suite.id}`)
      setCases(data.cases)
    } catch (err) {
      toast.error(translateError(err instanceof Error ? err.message : '', lang as 'en' | 'vi'))
    } finally { setLoadingCases(false) }
  }

  async function deleteSuite(id: string) {
    await apiClient.delete(`/api/testcases/suites/${id}`)
    setSuites((s) => s.filter((x) => x.id !== id))
    if (selectedSuite?.id === id) { setSelectedSuite(null); setCases([]) }
    toast.success(t('Suite deleted', 'Đã xóa suite'))
  }

  async function analyzeAI() {
    if (!selectedSuite) return
    setAnalyzingAI(true)
    try {
      const result = await apiClient.post<Record<string, unknown>>(`/api/testcases/suites/${selectedSuite.id}/analyze`, {})
      setAnalysis(result)
      setShowAnalysis(true)
      toast.success(t('AI analysis complete!', 'Phân tích AI xong!'))
    } catch (err) {
      toast.error(translateError(err instanceof Error ? err.message : '', lang as 'en' | 'vi'))
    } finally { setAnalyzingAI(false) }
  }

  async function generateMissing() {
    if (!selectedSuite) return
    setGenerating(true)
    try {
      const result = await apiClient.post<{ generated: number }>(`/api/testcases/suites/${selectedSuite.id}/generate-missing`, {})
      toast.success(t(`Generated ${result.generated} new cases!`, `Đã tạo ${result.generated} test case mới!`))
      selectSuite(selectedSuite)
    } catch (err) {
      toast.error(translateError(err instanceof Error ? err.message : '', lang as 'en' | 'vi'))
    } finally { setGenerating(false) }
  }

  async function exportSuite() {
    if (!selectedSuite) return
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
    const { createClient } = await import('@/lib/supabase/client')
    const sb = createClient()
    const { data: { session } } = await sb.auth.getSession()
    const res = await fetch(`${apiUrl}/api/testcases/suites/${selectedSuite.id}/export`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    if (!res.ok) { toast.error(t('Export failed', 'Xuất file thất bại')); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${selectedSuite.name}_export.xlsx`; a.click()
    URL.revokeObjectURL(url)
    toast.success(t('Exported!', 'Đã xuất file!'))
  }

  function handleQuickStatus(id: string, status: string) {
    setCases((prev) => prev.map((c) => (c as { id: string }).id === id ? { ...c, status } : c))
    if ((selectedTC as { id?: string })?.id === id) setSelectedTC((prev) => prev ? { ...prev, status } : prev)
    apiClient.post(`/api/testcases/${id}`, { status }).catch(() => {})
  }

  function handleUpdate(id: string, data: Record<string, unknown>) {
    setCases((prev) => prev.map((c) => (c as { id: string }).id === id ? { ...c, ...data } : c))
    if ((selectedTC as { id?: string })?.id === id) setSelectedTC((prev) => prev ? { ...prev, ...data } : prev)
  }

  useState(() => { loadSuites() })

  // Status counts
  const counts = cases.reduce<Record<string, number>>((acc, c) => {
    const s = String((c as { status?: string }).status ?? 'Not Run')
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})

  const filteredByTab = cases.filter((c) => {
    const s = String((c as { status?: string }).status ?? 'Not Run')
    if (activeTab === 'failed')  return s === 'Failed'
    if (activeTab === 'retest')  return s === 'Retest'
    if (activeTab === 'passed')  return s === 'Passed'
    return true
  })

  const filteredSuites = suites.filter((s) =>
    s.name.toLowerCase().includes(suiteSearch.toLowerCase())
  )

  const hasDrawer = selectedTC !== null

  return (
    <div className="h-full flex flex-col gap-0">

      {/* ── Top bar ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-violet-400" />
          <h1 className="font-bold text-sm">{t('QA Execution Workspace', 'Không Gian Thực Thi QA')}</h1>
          {selectedSuite && (
            <span className="text-xs text-muted-foreground/60">/ {selectedSuite.name}</span>
          )}
        </div>
        <GlowButton size="sm" onClick={() => setShowUpload(true)} icon={<Upload className="h-3.5 w-3.5" />}>
          {t('Upload', 'Upload')}
        </GlowButton>
      </div>

      {/* ── Main 3-col layout ──────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT: Suite list */}
        <div className="w-52 flex-shrink-0 flex flex-col border-r border-border bg-muted/10">
          <div className="p-2 border-b border-border/60">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
              <input value={suiteSearch} onChange={(e) => setSuiteSearch(e.target.value)}
                placeholder={t('Search suites...', 'Tìm suite...')}
                className="w-full rounded-lg bg-muted/50 border border-border pl-7 pr-2 py-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {filteredSuites.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-[11px] text-muted-foreground/50 text-center">{t('No suites. Upload Excel to start.', 'Chưa có suite. Upload Excel để bắt đầu.')}</p>
              </div>
            ) : (
              filteredSuites.map((suite) => (
                <button key={suite.id}
                  onClick={() => selectSuite(suite)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 text-[11px] border-b border-border/50 hover:bg-muted/40 transition-colors group relative',
                    selectedSuite?.id === suite.id ? 'bg-violet-500/10 border-l-2 border-l-violet-500' : ''
                  )}
                >
                  <p className={cn('font-medium truncate leading-tight', selectedSuite?.id === suite.id ? 'text-violet-300' : 'text-foreground/70')}>
                    {suite.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                    {suite.total_cases} {t('cases', 'test case')}
                    {suite.module && ` · ${suite.module}`}
                  </p>
                  <button onClick={(e) => { e.stopPropagation(); deleteSuite(suite.id) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-red-400 transition-all">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </button>
              ))
            )}
          </div>

          <div className="p-2 border-t border-border/60">
            <button onClick={loadSuites} className="w-full text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors py-1">
              ↻ {t('Refresh', 'Tải lại')}
            </button>
          </div>
        </div>

        {/* CENTER: Execution table */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedSuite ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
              <Database className="h-16 w-16 text-foreground/5" />
              <div>
                <p className="font-medium text-muted-foreground">{t('Select a suite to start', 'Chọn suite để bắt đầu')}</p>
                <p className="text-sm text-muted-foreground/40 mt-1">{t('Or upload an Excel/CSV file.', 'Hoặc upload file Excel/CSV.')}</p>
              </div>
              <GlowButton variant="secondary" onClick={() => setShowUpload(true)} icon={<Upload className="h-4 w-4" />}>
                {t('Upload Test Cases', 'Upload Test Case')}
              </GlowButton>
            </div>
          ) : (
            <>
              {/* Suite header */}
              <div className="px-4 py-3 border-b border-border flex-shrink-0">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <h2 className="font-bold text-sm">{selectedSuite.name}</h2>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {selectedSuite.module && <span className="text-[10px] text-muted-foreground/60">📦 {selectedSuite.module}</span>}
                      {selectedSuite.environment && <span className="text-[10px] text-muted-foreground/60">🌐 {selectedSuite.environment}</span>}
                      {selectedSuite.sprint && <span className="text-[10px] text-muted-foreground/60">🏃 {selectedSuite.sprint}</span>}
                      {selectedSuite.qa_owner && <span className="text-[10px] text-muted-foreground/60">👤 {selectedSuite.qa_owner}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <GlowButton size="sm" variant="secondary" onClick={analyzeAI} loading={analyzingAI} icon={<Brain className="h-3.5 w-3.5" />}>
                      AI
                    </GlowButton>
                    <GlowButton size="sm" variant="secondary" onClick={generateMissing} loading={generating} icon={<Sparkles className="h-3.5 w-3.5" />}>
                      {t('Generate', 'Tạo thêm')}
                    </GlowButton>
                    <GlowButton size="sm" variant="secondary" onClick={exportSuite} icon={<Download className="h-3.5 w-3.5" />}>
                      {t('Export', 'Xuất')}
                    </GlowButton>
                  </div>
                </div>

                {/* Status tabs */}
                <div className="flex items-center gap-1">
                  {([
                    { key: 'all',    label: t('All', 'Tất cả'),          count: cases.length },
                    { key: 'failed', label: t('Failed', 'Failed'),       count: counts['Failed'] ?? 0, color: 'text-red-400' },
                    { key: 'retest', label: t('Retest', 'Retest'),       count: counts['Retest'] ?? 0, color: 'text-blue-400' },
                    { key: 'passed', label: t('Passed', 'Passed'),       count: counts['Passed'] ?? 0, color: 'text-emerald-400' },
                  ] as const).map((tab) => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-medium transition-colors',
                        activeTab === tab.key ? 'bg-muted text-foreground' : 'text-muted-foreground/60 hover:text-foreground/60 hover:bg-muted/50'
                      )}>
                      {tab.label}
                      <span className={cn('text-[10px]', 'color' in tab ? tab.color : 'text-muted-foreground/50')}>{tab.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Analysis */}
              <AnimatePresence>
                {showAnalysis && analysis && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden flex-shrink-0">
                    <AIAnalysisPanel analysis={analysis} onClose={() => setShowAnalysis(false)} lang={lang} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Execution table */}
              <ExecutionTable
                cases={filteredByTab}
                loading={loadingCases}
                selectedId={(selectedTC as { id?: string })?.id ?? null}
                onSelect={(tc) => setSelectedTC(tc)}
                onQuickStatus={handleQuickStatus}
                lang={lang}
              />
            </>
          )}
        </div>

        {/* RIGHT: Detail drawer */}
        <AnimatePresence>
          {selectedTC && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 380 }}
              exit={{ width: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="flex-shrink-0 overflow-hidden"
            >
              <DetailDrawer
                tc={selectedTC}
                onClose={() => setSelectedTC(null)}
                onUpdate={handleUpdate}
                lang={lang}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload modal */}
      <AnimatePresence>
        {showUpload && (
          <SuiteUploadPanel
            onClose={() => setShowUpload(false)}
            onSuccess={() => { setShowUpload(false); loadSuites() }}
            lang={lang}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
