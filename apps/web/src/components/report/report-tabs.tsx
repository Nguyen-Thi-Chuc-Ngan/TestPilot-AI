'use client'

import { useState } from 'react'
import { Bug, FileText, Code2, Download, AlertTriangle } from 'lucide-react'
import { FindingsPanel } from './findings-panel'
import { TestCasesPanel } from './test-cases-panel'
import { BugReportsPanel } from './bug-reports-panel'
import { ScriptPanel } from './script-panel'
import { toast } from 'sonner'

interface Props {
  job: Record<string, unknown>
  findings: Record<string, unknown>[]
  testCases: Record<string, unknown>[]
  bugReports: Record<string, unknown>[]
  artifacts: Record<string, unknown>[]
}

const tabs = [
  { id: 'findings', label: 'Findings', icon: Bug },
  { id: 'testcases', label: 'Test Cases', icon: FileText },
  { id: 'bugreports', label: 'Bug Reports', icon: AlertTriangle },
  { id: 'script', label: 'Automation Script', icon: Code2 },
]

export function ReportTabs({ job, findings, testCases, bugReports, artifacts }: Props) {
  const [activeTab, setActiveTab] = useState('findings')
  const [exporting, setExporting] = useState(false)

  async function handleExport(format: 'md' | 'html') {
    setExporting(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/report/${job.id}/export/${format}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `testpilot-report.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported as ${format.toUpperCase()}`)
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  // Find the automation script artifact
  const scriptArtifact = artifacts.find((a) => (a as { type: string }).type === 'script')

  return (
    <div className="space-y-4">
      {/* Tab header + export buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.id === 'findings' && findings.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                  {findings.length}
                </span>
              )}
              {tab.id === 'testcases' && testCases.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                  {testCases.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Export buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('md')}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Markdown
          </button>
          <button
            onClick={() => handleExport('html')}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            HTML
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'findings' && <FindingsPanel findings={findings} />}
        {activeTab === 'testcases' && <TestCasesPanel testCases={testCases} />}
        {activeTab === 'bugreports' && <BugReportsPanel bugReports={bugReports} />}
        {activeTab === 'script' && <ScriptPanel artifact={scriptArtifact} />}
      </div>
    </div>
  )
}
