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
  displayName: z.string().min(2, 'Min 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
})
type Form = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  async function onSubmit(data: Form) {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { display_name: data.displayName } },
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Account created! Check your email.')
    router.push('/dashboard')
  }

  const fields = [
    { key: 'displayName' as const, label: 'Display name', type: 'text', placeholder: 'Your name' },
    { key: 'email' as const,       label: 'Email',        type: 'email', placeholder: 'you@example.com' },
    { key: 'password' as const,    label: 'Password',     type: 'password', placeholder: 'Min. 8 characters' },
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-violet-600/8 blur-[120px]" />
        <div className="grid-pattern absolute inset-0 opacity-30" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-neon-purple">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl">TestPilot <span className="text-violet-400">AI</span></span>
        </Link>

        <GlassCard className="p-7">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">Create account</h1>
            <p className="text-sm text-muted-foreground">Join the AI-powered QA platform</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5 block">{f.label}</label>
                <input
                  {...register(f.key)}
                  type={f.type}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                />
                {errors[f.key] && <p className="text-red-400 text-xs mt-1">{errors[f.key]?.message}</p>}
              </div>
            ))}
            <GlowButton type="submit" loading={loading} className="w-full mt-2" size="md">
              Create account <ArrowRight className="h-4 w-4" />
            </GlowButton>
          </form>

          <p className="text-center text-sm text-muted-foreground/70 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  )
}


