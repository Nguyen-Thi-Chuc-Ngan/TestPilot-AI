'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface GlowButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
  icon?: React.ReactNode
}

export function GlowButton({
  children, onClick, type = 'button', variant = 'primary',
  size = 'md', disabled, loading, className, icon
}: GlowButtonProps) {
  const variants = {
    primary:   'bg-violet-600 hover:bg-violet-500 text-white border border-violet-500/40 hover:border-violet-400/60 dark:hover:shadow-[0_0_20px_rgba(124,58,237,0.35)]',
    secondary: 'bg-muted hover:bg-muted/80 text-foreground border border-border hover:border-border/80 dark:bg-white/5 dark:hover:bg-white/8 dark:text-white/80 dark:border-white/10 dark:hover:border-white/20',
    danger:    'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-600/15 dark:hover:bg-red-600/25 dark:text-red-400 dark:border-red-500/25',
    ghost:     'hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent dark:hover:bg-white/5 dark:text-white/40 dark:hover:text-white/80',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2 text-sm gap-2 rounded-lg',
    lg: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </motion.button>
  )
}
