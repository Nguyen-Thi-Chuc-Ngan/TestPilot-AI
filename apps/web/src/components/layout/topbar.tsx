'use client'

import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import { ThemeLangToggle } from './theme-lang-toggle'
import { useLang } from '@/stores/language-store'
import { CommandPalette } from '@/components/ui/command-palette'
import { useEffect, useState } from 'react'

interface TopbarProps { user: User }

export function Topbar({ user }: TopbarProps) {
  const router = useRouter()
  const supabase = createClient()
  const { lang } = useLang()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  const displayName = user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'User'
  const signOutLabel = mounted && lang === 'vi' ? 'Đăng xuất' : 'Sign out'

  return (
    <header className="flex h-16 items-center justify-end border-b border-border bg-card dark:border-white/[0.06] dark:bg-black/30 dark:backdrop-blur-xl px-6 gap-3 flex-shrink-0">
      <CommandPalette />
      <ThemeLangToggle />
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-600/30 border border-violet-300 dark:border-violet-500/30 flex items-center justify-center">
          <UserIcon className="h-3 w-3 text-violet-600 dark:text-violet-400" />
        </div>
        <span className="hidden sm:inline text-xs font-medium text-foreground">{displayName}</span>
      </div>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{signOutLabel}</span>
      </button>
    </header>
  )
}
