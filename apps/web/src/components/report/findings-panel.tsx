'use client'

import { AlertTriangle, Info, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

interface Finding {
  id: string
  category: string
  title: string
  description: string
  severity: string
  element_hint?: string
  recommendation?: string
  roast_comment?: string
}

const severityConfig = {
  critical: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: XCircle },
  high: { color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: AlertCircle },
  medium: { color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', icon: AlertTriangle },
  low: { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Info },
  info: { color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: CheckCircle2 },
}

export function FindingsPanel({ findings }: { findings: Record<string, unknown>[] }) {
  const typed = findings as unknown as Finding[]

  if (typed.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500/40 mx-auto mb-3" />
        <p className="font-medium">No findings</p>
        <p className="text-sm text-muted-foreground mt-1">This page looks clean!</p>
      </div>
    )
  }

  const bySeverity = ['critical', 'high', 'medium', 'low', 'info'].flatMap((sev) =>
    typed.filter((f) => f.severity === sev)
  )

  return (
    <div className="space-y-3">
      {bySeverity.map((finding) => {
        const cfg = severityConfig[finding.severity as keyof typeof severityConfig] ?? severityConfig.info
        return (
          <div key={finding.id} className={`rounded-xl border p-4 ${cfg.bg}`}>
            <div className="flex items-start gap-3">
              <cfg.icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>
                    {finding.severity}
                  </span>
                  <span className="text-xs text-muted-foreground bg-white/60 rounded px-1.5 py-0.5 border">
                    {finding.category}
                  </span>
                </div>
                <h3 className="font-semibold text-sm mb-1">{finding.title}</h3>
                <p className="text-sm text-muted-foreground">{finding.description}</p>

                {finding.element_hint && (
                  <p className="text-xs text-muted-foreground mt-2">
                    <span className="font-medium">Location:</span> {finding.element_hint}
                  </p>
                )}

                {finding.recommendation && (
                  <div className="mt-3 rounded-lg bg-white/70 border border-white/80 p-3">
                    <p className="text-xs font-medium mb-0.5">Recommendation</p>
                    <p className="text-xs text-muted-foreground">{finding.recommendation}</p>
                  </div>
                )}

                {finding.roast_comment && (
                  <div className="mt-2 rounded-lg bg-orange-100/60 border border-orange-200 p-3">
                    <p className="text-xs font-medium text-orange-700 mb-0.5">🔥 Roast</p>
                    <p className="text-xs text-orange-800 italic">{finding.roast_comment}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
