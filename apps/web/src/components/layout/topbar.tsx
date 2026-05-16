'use client'

import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'

interface TopbarProps {
  user: User
}

export function Topbar({ user }: TopbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  const displayName =
    user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'User'

  return (
    <header className="flex h-16 items-center justify-end border-b border-border bg-card px-6 gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <UserIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{displayName}</span>
      </div>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </header>
  )
}
