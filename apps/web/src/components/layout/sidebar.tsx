'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ScanLine,
  Clock,
  Gamepad2,
  Mic,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scan/new', label: 'New Scan', icon: ScanLine },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/game', label: 'Game Arena', icon: Gamepad2 },
  { href: '/interview', label: 'Interview Trainer', icon: Mic },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-base">TestPilot AI</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <p className="text-xs text-muted-foreground px-3">TestPilot AI v0.1</p>
      </div>
    </aside>
  )
}
