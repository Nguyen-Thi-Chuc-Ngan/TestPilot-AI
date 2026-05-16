import { cn } from '@/lib/utils'

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

const config: Record<Severity, { label: string; cls: string; dot: string }> = {
  critical: { label: 'CRITICAL', cls: 'bg-red-500/15 text-red-400 border-red-500/30',     dot: 'bg-red-400 animate-pulse' },
  high:     { label: 'HIGH',     cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30', dot: 'bg-orange-400' },
  medium:   { label: 'MEDIUM',   cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-400' },
  low:      { label: 'LOW',      cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30',   dot: 'bg-blue-400' },
  info:     { label: 'INFO',     cls: 'bg-white/5 text-white/50 border-white/10',           dot: 'bg-white/40' },
}

export function SeverityBadge({ severity }: { severity: string }) {
  const s = (severity as Severity) in config ? (severity as Severity) : 'info'
  const { label, cls, dot } = config[s]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-widest', cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}
