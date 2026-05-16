'use client'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'

interface BugReport {
  id: string
  title: string
  severity: string
  priority: string
  steps_to_reproduce: string[]
  expected_result: string
  actual_result: string
  impact: string
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
}

export function BugReportsPanel({ bugReports }: { bugReports: Record<string, unknown>[] }) {
  const typed = bugReports as unknown as BugReport[]

  function copyReport(report: BugReport) {
    const text = `## ${report.title}

**Severity:** ${report.severity} | **Priority:** ${report.priority}

**Steps to Reproduce:**
${report.steps_to_reproduce.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**Expected Result:** ${report.expected_result}

**Actual Result:** ${report.actual_result}

**Impact:** ${report.impact}`
    navigator.clipboard.writeText(text)
    toast.success('Bug report copied to clipboard!')
  }

  if (typed.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground">No bug reports generated.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {typed.map((report) => (
        <div key={report.id} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-start justify-between p-4 border-b border-border">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-2">{report.title}</h3>
              <div className="flex gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 text-xs font-medium ${severityColors[report.severity] ?? 'bg-muted text-muted-foreground'}`}
                >
                  {report.severity}
                </span>
                <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium">
                  {report.priority}
                </span>
              </div>
            </div>
            <button
              onClick={() => copyReport(report)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-3"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Steps to Reproduce
              </p>
              <ol className="space-y-1">
                {report.steps_to_reproduce?.map((step, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-muted-foreground font-mono">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Expected Result
                </p>
                <p className="text-sm text-muted-foreground">{report.expected_result}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Actual Result
                </p>
                <p className="text-sm text-muted-foreground">{report.actual_result}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Impact
              </p>
              <p className="text-sm text-muted-foreground">{report.impact}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
