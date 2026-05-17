'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ScanLine, Clock, Gamepad2, Mic, Zap,
  BookOpen, User, Swords, AlertTriangle, Table2, CheckSquare, CalendarDays, Bug, Rocket, Beaker, GraduationCap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLang } from '@/stores/language-store'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { href: '/dashboard',        icon: LayoutDashboard, en: 'Dashboard',      vi: 'Tổng quan',      group: null },
  { href: '/scan/new',         icon: ScanLine,        en: 'New Scan',        vi: 'Quét mới',       group: null },
  { href: '/history',          icon: Clock,           en: 'History',         vi: 'Lịch sử',        group: null },
  { href: '/testcases',        icon: Table2,          en: 'Test Cases',      vi: 'Kho Test Case',  group: null },
  { href: '/bugs',             icon: Bug,             en: 'Bug Tracker',     vi: 'Theo Dõi Bug',   group: null },
  { href: '/releases',         icon: Rocket,          en: 'Releases',        vi: 'Release',         group: null },
  // Workspace
  { href: '/workspace/todos',  icon: CheckSquare,     en: 'Todo List',       vi: 'Việc Cần Làm',   group: 'workspace' },
  { href: '/workspace/log',    icon: CalendarDays,    en: 'Daily Log',       vi: 'Nhật Ký Ngày',   group: 'workspace' },
  { href: '/notes',            icon: BookOpen,        en: 'QA Notes',        vi: 'Ghi Chú QA',     group: 'workspace' },
  // Training
  { href: '/lab',              icon: Beaker,          en: 'QA Lab',          vi: 'Phòng Lab QA',   group: 'training' },
  { href: '/battle',           icon: Swords,          en: 'AI Battle',       vi: 'Đấu Với AI',     group: 'training' },
  { href: '/panic',            icon: AlertTriangle,   en: 'Panic Mode',      vi: 'Panic Mode',     group: 'training' },
  { href: '/game',             icon: Gamepad2,        en: 'Bug Hunt',        vi: 'Game Tìm Lỗi',   group: 'training' },
  { href: '/interview',        icon: Mic,             en: 'Interview',       vi: 'Phỏng Vấn AI',   group: 'training' },
  { href: '/english',          icon: GraduationCap,   en: 'English Coach',   vi: 'Luyện Tiếng Anh', group: 'training' },
  { href: '/profile',          icon: User,            en: 'Profile',         vi: 'Hồ Sơ',          group: null },
]

const GROUP_LABELS: Record<string, { en: string; vi: string }> = {
  workspace: { en: 'Workspace', vi: 'Workspace' },
  training:  { en: 'Training',  vi: 'Luyện Tập' },
}

export function Sidebar() {
  const pathname = usePathname()
  const { lang } = useLang()
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => setMounted(true), [])

  return (
    <motion.aside
      animate={{ width: expanded ? 220 : 48 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="hidden md:flex flex-col flex-shrink-0 border-r border-border bg-card dark:border-white/[0.06] dark:bg-black/40 dark:backdrop-blur-xl overflow-hidden"
    >
      {/* Logo — click to toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        className="flex h-16 items-center border-b border-border dark:border-white/[0.06] px-3 gap-2.5 flex-shrink-0 w-full hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors"
      >
        <motion.div
          animate={{ rotate: expanded ? 0 : 180 }}
          transition={{ duration: 0.25 }}
          className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center shadow-neon-purple flex-shrink-0"
        >
          <Zap className="h-3.5 w-3.5 text-white" />
        </motion.div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <span className="font-bold text-sm tracking-tight">TestPilot</span>
              <span className="text-violet-400 font-bold text-sm"> AI</span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item, idx) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const label = mounted && lang === 'vi' ? item.vi : item.en
          const prevGroup = idx > 0 ? navItems[idx - 1].group : null
          const showGroupLabel = expanded && item.group && item.group !== prevGroup

          return (
            <div key={item.href}>
              {showGroupLabel && (
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest px-3 pt-3 pb-1">
                  {mounted && lang === 'vi' ? GROUP_LABELS[item.group!].vi : GROUP_LABELS[item.group!].en}
                </p>
              )}
            <Link href={item.href} className="block relative mb-0.5" title={!expanded ? label : undefined}>
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg bg-violet-600/15 border border-violet-500/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <div className={cn(
                'relative flex items-center rounded-lg transition-colors',
                expanded ? 'gap-2.5 px-3 py-2' : 'justify-center py-2.5',
                active
                  ? 'text-violet-600 dark:text-violet-300'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted dark:text-white/40 dark:hover:text-white/80 dark:hover:bg-white/[0.04]'
              )}>
                <item.icon className={cn('h-4 w-4 flex-shrink-0', active && 'text-violet-400')} />

                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden flex-1"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {active && expanded && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                )}
                {active && !expanded && (
                  <span className="absolute right-0.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-violet-400" />
                )}
              </div>
            </Link>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border dark:border-white/[0.06] p-3">
        <div className={cn('flex items-center gap-2', !expanded && 'justify-center')}>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-muted-foreground/40 font-mono truncate"
              >
                v0.1.0 · online
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  )
}
