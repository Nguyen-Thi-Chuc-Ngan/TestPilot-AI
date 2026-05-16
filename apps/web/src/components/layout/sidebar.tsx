'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ScanLine, Clock, Gamepad2, Mic, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLang } from '@/stores/language-store'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, en: 'Dashboard',         vi: 'Tổng quan' },
  { href: '/scan/new',  icon: ScanLine,        en: 'New Scan',           vi: 'Quét mới' },
  { href: '/history',   icon: Clock,           en: 'History',            vi: 'Lịch sử' },
  { href: '/game',      icon: Gamepad2,        en: 'Battle Mode',        vi: 'Game Tìm Lỗi' },
  { href: '/interview', icon: Mic,             en: 'Interview Trainer',  vi: 'Luyện Phỏng Vấn' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { lang } = useLang()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <aside className="hidden md:flex w-56 flex-col flex-shrink-0 border-r border-border bg-card dark:border-white/[0.06] dark:bg-black/40 dark:backdrop-blur-xl">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border dark:border-white/[0.06] px-4">
        <div className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center shadow-neon-purple">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <span className="font-bold text-sm tracking-tight">TestPilot</span>
          <span className="text-violet-400 font-bold text-sm"> AI</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const label = mounted && lang === 'vi' ? item.vi : item.en
          return (
            <Link key={item.href} href={item.href} className="block relative">
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg bg-violet-600/15 border border-violet-500/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <div className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'text-violet-600 dark:text-violet-300' : 'text-muted-foreground hover:text-foreground hover:bg-muted dark:text-white/40 dark:hover:text-white/80 dark:hover:bg-white/[0.04]'
              )}>
                <item.icon className={cn('h-4 w-4 flex-shrink-0', active && 'text-violet-400')} />
                {label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border dark:border-white/[0.06] p-3">
        <div className="flex items-center gap-2 px-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/25 font-mono">v0.1.0 · online</span>
        </div>
      </div>
    </aside>
  )
}
