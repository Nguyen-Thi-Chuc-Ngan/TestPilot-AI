'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ActivityLine {
  id: number
  type: 'info' | 'warn' | 'success' | 'error' | 'ai'
  message: string
  time: string
}

const typeStyles = {
  info:    'text-white/50',
  warn:    'text-yellow-400',
  success: 'text-emerald-400',
  error:   'text-red-400',
  ai:      'text-violet-400',
}

const typePrefix = {
  info:    '[SYS]',
  warn:    '[WARN]',
  success: '[OK]',
  error:   '[ERR]',
  ai:      '[AI]',
}

interface Props {
  lines: { type: ActivityLine['type']; message: string }[]
  className?: string
  maxLines?: number
}

export function AIActivityFeed({ lines, className, maxLines = 8 }: Props) {
  const [items, setItems] = useState<ActivityLine[]>([])
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (idx >= lines.length) return
    const timer = setTimeout(() => {
      const now = new Date()
      const time = now.toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setItems((prev) => {
        const next = [...prev, { id: Date.now(), ...lines[idx], time }]
        return next.slice(-maxLines)
      })
      setIdx((i) => i + 1)
    }, 600 + Math.random() * 400)
    return () => clearTimeout(timer)
  }, [idx, lines, maxLines])

  return (
    <div className={cn('font-mono text-xs space-y-1 overflow-hidden', className)}>
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2"
          >
            <span className="text-white/20 flex-shrink-0">{item.time}</span>
            <span className={cn('font-semibold flex-shrink-0', typeStyles[item.type])}>
              {typePrefix[item.type]}
            </span>
            <span className="text-white/70">{item.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      {idx < lines.length && (
        <div className="flex items-center gap-1 text-white/20">
          <span className="cursor-blink" />
        </div>
      )}
    </div>
  )
}
