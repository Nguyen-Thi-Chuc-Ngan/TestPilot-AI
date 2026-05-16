'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Step {
  step: number
  action: string
  expected: string
}

interface TestCase {
  id: string
  case_id: string
  title: string
  category: string
  priority: string
  preconditions: string[]
  steps: Step[]
  expected_result: string
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
}

export function TestCasesPanel({ testCases }: { testCases: Record<string, unknown>[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const typed = testCases as unknown as TestCase[]

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (typed.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground">No test cases generated.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {typed.map((tc) => {
        const isOpen = expanded.has(tc.id)
        return (
          <div key={tc.id} className="rounded-xl border border-border overflow-hidden">
            <button
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
              onClick={() => toggle(tc.id)}
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="text-xs font-mono text-muted-foreground w-16">{tc.case_id}</span>
              <span className="flex-1 text-sm font-medium">{tc.title}</span>
              <div className="flex gap-1.5">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${priorityColors[tc.priority] ?? 'bg-muted text-muted-foreground'}`}
                >
                  {tc.priority}
                </span>
                <span className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                  {tc.category}
                </span>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border p-4 bg-muted/20 space-y-4">
                {tc.preconditions?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                      Preconditions
                    </p>
                    <ul className="space-y-1">
                      {tc.preconditions.map((p, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span>•</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Steps
                  </p>
                  <div className="space-y-2">
                    {tc.steps?.map((step) => (
                      <div key={step.step} className="grid grid-cols-12 gap-3 text-sm">
                        <span className="col-span-1 text-muted-foreground font-mono text-xs pt-0.5">
                          {step.step}.
                        </span>
                        <div className="col-span-6">
                          <p className="font-medium text-xs text-muted-foreground mb-0.5">Action</p>
                          <p>{step.action}</p>
                        </div>
                        <div className="col-span-5">
                          <p className="font-medium text-xs text-muted-foreground mb-0.5">Expected</p>
                          <p className="text-muted-foreground">{step.expected}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                    Expected Result
                  </p>
                  <p className="text-sm text-muted-foreground">{tc.expected_result}</p>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
