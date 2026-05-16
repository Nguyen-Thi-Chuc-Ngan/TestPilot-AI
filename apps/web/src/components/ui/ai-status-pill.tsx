'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AIStatusPillProps {
  status: 'idle' | 'scanning' | 'analyzing' | 'complete' | 'error'
  label?: string
  className?: string
}

const statusConfig = {
  idle:      { color: 'text-muted-foreground', dot: 'bg-muted-foreground/40', label: 'AI Idle' },
  scanning:  { color: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500', label: 'Scanning...' },
  analyzing: { color: 'text-blue-600 dark:text-blue-400',    dot: 'bg-blue-500',   label: 'Analyzing...' },
  complete:  { color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', label: 'Complete' },
  error:     { color: 'text-red-600 dark:text-red-400',      dot: 'bg-red-500',    label: 'Error' },
}

export function AIStatusPill({ status, label, className }: AIStatusPillProps) {
  const { color, dot, label: defaultLabel } = statusConfig[status]
  const isActive = status === 'scanning' || status === 'analyzing'

  return (
    <div className={cn('inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1', className)}>
      <div className="relative flex items-center justify-center">
        <span className={cn('h-2 w-2 rounded-full', dot)} />
        {isActive && (
          <motion.span
            className={cn('absolute h-2 w-2 rounded-full', dot)}
            animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
      <span className={cn('text-xs font-medium', color)}>{label ?? defaultLabel}</span>
    </div>
  )
}
