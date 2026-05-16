'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bug, FileText, Code2, Download, AlertTriangle, Loader2 } from 'lucide-react'
import { FindingsPanel } from './findings-panel'
import { TestCasesPanel } from './test-cases-panel'
import { BugReportsPanel } from './bug-reports-panel'
import { ScriptPanel } from './script-panel'
import { toast } from 'sonner'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { AnimatedCounter } from '@/components/ui/animated-counter'

interface Props {
  job: Record<string, unknown>
  findings: Record<string, unknown>[]
  testCases: Record<string, unknown>[]
  bugReports: Record<string, unknown>[]
  artifacts: Record<string, unknown>[]
}

const tabs = [
  { id: 'findings',    label: 'Findings',    icon: Bug },
  { id: 'testcases',   label: 'Test Cases',  icon: FileText },
  { id: 'bugreports',  label: 'Bug Reports', icon: AlertTriangle },
  { id: 'script',      label: 'Script',      icon: Code2 },
]

const severityCount = (findings: Record<string, unknown>[], sev: string) =>
  findings.filter((f) => f.severity === sev).length

export function ReportTabs({ job, findings, testCases, bugReports, artifacts }: Props) {
  const [activeTab, setActiveTab] = useState('findings')
  const [exporting, setExporting] = useState(false)
  const scriptArtifact = artifacts.find((a) => (a as { type: string }).type === 'script')

  const critical = severityCount(findings, 'critical')
  const high = severityCount(findings, 'high')
  const medium = severityCount(findings, 'medium')

  async function handleExport(format: 'md' | 'html') {
    setExporting(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/report/${job.id}/export/${format}`, { credentials: 'include' })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `testpilot-report.${format}`; a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported as ${format.toUpperCase()}`)
    } catch { toast.error('Export failed') }
    finally { setExporting(false) }
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Bug className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-white/40">Total findings</p>
              <p className="text-lg font-bold"><AnimatedCounter value={findings.length} /></p>
            </div>
          </div>
          <div className="w-px h-8 bg-white/[0.06]" />
          <div className="flex items-center gap-2 flex-wrap">
            {critical > 0 && <SeverityBadge severity="critical" />}
            {high > 0 && <SeverityBadge severity="high" />}
            {medium > 0 && <SeverityBadge severity="medium" />}
          </div>
          <div className="ml-auto flex gap-2">
            <GlowButton
              variant="secondary" size="sm"
              loading={exporting}
              onClick={() => handleExport('md')}
              icon={<Download className="h-3.5 w-3.5" />}
            >
              Markdown
            </GlowButton>
            <GlowButton
              variant="secondary" size="sm"
              loading={exporting}
              onClick={() => handleExport('html')}
              icon={<Download className="h-3.5 w-3.5" />}
            >
              HTML
            </GlowButton>
          </div>
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.06] pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-violet-400' : 'text-white/30'}`} />
            <span className={activeTab === tab.id ? 'text-white' : 'text-white/40'}>{tab.label}</span>
            {tab.id === 'findings' && findings.length > 0 && (
              <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-300 font-bold">
                {findings.length}
              </span>
            )}
            {tab.id === 'testcases' && testCases.length > 0 && (
              <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300 font-bold">
                {testCases.length}
              </span>
            )}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-blue-500 rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'findings'   && <FindingsPanel   findings={findings} />}
        {activeTab === 'testcases'  && <TestCasesPanel  testCases={testCases} />}
        {activeTab === 'bugreports' && <BugReportsPanel bugReports={bugReports} />}
        {activeTab === 'script'     && <ScriptPanel     artifact={scriptArtifact} />}
      </div>
    </div>
  )
}
