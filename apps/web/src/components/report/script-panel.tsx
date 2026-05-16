'use client'

import { useState } from 'react'
import { Copy, Check, Code2 } from 'lucide-react'
import { toast } from 'sonner'

interface Artifact {
  type: string
  public_url?: string
  storage_path?: string
}

export function ScriptPanel({ artifact }: { artifact?: Record<string, unknown> }) {
  const [copied, setCopied] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const typedArtifact = artifact as Artifact | undefined

  async function loadScript() {
    if (!typedArtifact?.public_url) return
    setLoading(true)
    try {
      const res = await fetch(typedArtifact.public_url)
      const text = await res.text()
      setCode(text)
    } catch {
      toast.error('Failed to load script')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Script copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!typedArtifact) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <Code2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="font-medium text-muted-foreground">No automation script generated</p>
        <p className="text-sm text-muted-foreground/60 mt-1">
          Run a Full Analysis scan to get a Playwright script.
        </p>
      </div>
    )
  }

  if (!code && !loading) {
    return (
      <div className="rounded-xl border border-border p-12 text-center">
        <Code2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="font-medium mb-3">Playwright TypeScript automation script ready</p>
        <button
          onClick={loadScript}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Load Script
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Code2 className="h-4 w-4" />
          <span className="font-mono text-xs">playwright.spec.ts</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed bg-[#0d1117] text-[#e6edf3] max-h-[600px] overflow-y-auto">
        <code>{loading ? 'Loading...' : (code ?? '')}</code>
      </pre>
    </div>
  )
}
