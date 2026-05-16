'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: 'purple' | 'blue' | 'green' | 'red' | 'none'
  onClick?: () => void
}

export function GlassCard({ children, className, hover = false, glow = 'none', onClick }: GlassCardProps) {
  const glowStyles = {
    purple: 'dark:hover:shadow-neon-purple dark:hover:border-violet-500/30',
    blue:   'dark:hover:shadow-neon-blue dark:hover:border-blue-500/25',
    green:  'dark:hover:shadow-neon-green',
    red:    'dark:hover:shadow-neon-red',
    none:   '',
  }

  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { y: -1, scale: 1.002 } : undefined}
      transition={{ duration: 0.2 }}
      className={cn(
        // Light mode: clean card
        'rounded-xl border border-border bg-card shadow-sm',
        // Dark mode: glassmorphism override
        'dark:border-white/[0.07] dark:bg-white/[0.03] dark:backdrop-blur-sm dark:shadow-glass',
        hover && 'cursor-pointer transition-all duration-200 hover:shadow-md dark:hover:bg-white/[0.05]',
        glow !== 'none' && glowStyles[glow],
        className
      )}
    >
      {children}
    </motion.div>
  )
}
