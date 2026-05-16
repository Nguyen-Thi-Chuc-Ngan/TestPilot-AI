'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Zap, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { GlowButton } from '@/components/ui/glow-button'
import { GlassCard } from '@/components/ui/glass-card'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
})
type Form = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  async function onSubmit(data: Form) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) { toast.error(error.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-violet-600/8 blur-[120px]" />
        <div className="grid-pattern absolute inset-0 opacity-30" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-neon-purple">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl">TestPilot <span className="text-violet-400">AI</span></span>
        </Link>

        <GlassCard className="p-7">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your QA workspace</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">Password</label>
              <input
                {...register('password')}
                type="password"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <GlowButton type="submit" loading={loading} className="w-full mt-2" size="md">
              Sign in <ArrowRight className="h-4 w-4" />
            </GlowButton>
          </form>

          <p className="text-center text-sm text-muted-foreground/70 mt-5">
            No account?{' '}
            <Link href="/register" className="text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  )
}


