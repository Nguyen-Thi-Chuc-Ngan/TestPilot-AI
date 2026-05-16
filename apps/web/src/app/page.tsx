'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Bug, FileCode, Brain, Gamepad2, Mic, Shield, ChevronRight, Terminal } from 'lucide-react'
import { GlowButton } from '@/components/ui/glow-button'
import { GlassCard } from '@/components/ui/glass-card'
import { AIActivityFeed } from '@/components/ui/ai-activity-feed'

const SCAN_ACTIVITY = [
  { type: 'ai' as const, message: 'Initializing browser context...' },
  { type: 'info' as const, message: 'Navigating to target URL' },
  { type: 'ai' as const, message: 'Capturing viewport screenshots' },
  { type: 'warn' as const, message: 'Contrast ratio violation detected — WCAG AA fail' },
  { type: 'ai' as const, message: 'Analyzing DOM structure and accessibility tree' },
  { type: 'error' as const, message: 'Missing alt attributes on 3 images' },
  { type: 'ai' as const, message: 'Generating test cases from findings...' },
  { type: 'warn' as const, message: 'Form lacks CSRF protection indicator' },
  { type: 'ai' as const, message: 'Severity assessment: HIGH — 2 critical issues' },
  { type: 'success' as const, message: 'Report generated — 12 findings, 8 test cases' },
]

const features = [
  { icon: Bug,      title: 'AI Bug Hunter',        desc: 'Vision AI scans screenshots and surfaces issues with severity ratings.',     color: 'text-red-400',    glow: 'from-red-500/20' },
  { icon: FileCode, title: 'Test Case Generator',  desc: 'Structured QA test cases with preconditions and steps ready for Jira.',     color: 'text-blue-400',   glow: 'from-blue-500/20' },
  { icon: Zap,      title: 'Playwright Script',    desc: 'Auto-generate runnable TypeScript automation scripts from findings.',       color: 'text-yellow-400', glow: 'from-yellow-500/20' },
  { icon: Brain,    title: 'AI Roast Mode',        desc: 'Savage but constructive UX feedback that makes devs actually fix things.',  color: 'text-purple-400', glow: 'from-purple-500/20' },
  { icon: Gamepad2, title: 'Battle Mode',          desc: 'Find bugs in intentionally broken apps. Compete for the highest score.',    color: 'text-green-400',  glow: 'from-green-500/20' },
  { icon: Mic,      title: 'Interview Trainer',    desc: 'Practice QA interviews with AI that grades answers like a senior.',         color: 'text-cyan-400',   glow: 'from-cyan-500/20' },
]

const stats = [
  { value: '2.4s',  label: 'Avg scan time' },
  { value: '94%',   label: 'Bug detection rate' },
  { value: '12x',   label: 'Faster than manual' },
  { value: '100%',  label: 'Free to use' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-violet-600/8 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/3 right-0 w-[500px] h-[400px] bg-blue-600/6 blur-[100px] rounded-full" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[300px] bg-cyan-600/4 blur-[80px] rounded-full" />
        <div className="grid-pattern absolute inset-0 opacity-40" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-neon-purple">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">TestPilot <span className="gradient-text-purple">AI</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors">Sign in</Link>
            <GlowButton size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>
              <Link href="/register">Get started</Link>
            </GlowButton>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300 mb-8"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            Powered by Groq + Llama 4 Scout Vision
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          </motion.div>

          {/* Headline */}
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            Find bugs before
            <br />
            <span className="gradient-text">your users do.</span>
          </h1>

          <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered QA copilot for modern testers. Enter any URL and get bug reports,
            test cases, and automation scripts in under 60 seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <GlowButton size="lg" icon={<Zap className="h-4 w-4" />}>
                Start scanning free
              </GlowButton>
            </Link>
            <Link href="/dashboard">
              <GlowButton size="lg" variant="secondary">
                View live demo
                <ArrowRight className="h-4 w-4" />
              </GlowButton>
            </Link>
          </div>
        </motion.div>

        {/* Hero visual — AI terminal */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-16 relative"
        >
          {/* Glow behind terminal */}
          <div className="absolute -inset-4 bg-violet-600/10 blur-3xl rounded-3xl" />

          <GlassCard className="relative overflow-hidden max-w-3xl mx-auto">
            {/* Terminal header */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/70" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                  <div className="h-3 w-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-xs text-white/30 ml-2 font-mono">testpilot — scan https://example.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-mono">LIVE</span>
              </div>
            </div>

            {/* Terminal body */}
            <div className="p-5 bg-black/20 min-h-[200px] scan-line">
              <AIActivityFeed lines={SCAN_ACTIVITY} maxLines={10} />
            </div>

            {/* Bottom stats bar */}
            <div className="border-t border-white/5 px-4 py-2 flex items-center gap-6 text-xs font-mono">
              <span className="text-white/30">scan_id: tp_a8f2c1</span>
              <span className="text-violet-400">12 findings</span>
              <span className="text-red-400">2 critical</span>
              <span className="text-yellow-400">4 high</span>
              <span className="ml-auto text-white/20">elapsed: 2.4s</span>
            </div>
          </GlassCard>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative border-y border-white/5 bg-white/[0.02] py-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl font-bold gradient-text-purple">{s.value}</div>
                <div className="text-sm text-white/40 mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50 mb-4">
            <Terminal className="h-3 w-3" />
            Six AI modules, one platform
          </div>
          <h2 className="text-4xl font-bold mb-4">Everything a QA needs</h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            From bug detection to interview prep — all powered by AI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
            >
              <GlassCard hover glow="purple" className="p-5 h-full">
                <div className={`inline-flex rounded-lg bg-gradient-to-br ${f.glow} to-transparent p-2.5 mb-4`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Workflow section */}
      <section className="relative border-t border-white/5 bg-white/[0.01] py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How it works</h2>
            <p className="text-white/40">Three steps from URL to full QA report.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Enter URL', desc: 'Paste any public URL. Add optional requirements or context.', color: 'border-violet-500/40 bg-violet-500/5' },
              { step: '02', title: 'AI Scans', desc: 'Playwright crawls, takes screenshots. AI analyzes with vision model.', color: 'border-blue-500/40 bg-blue-500/5' },
              { step: '03', title: 'Get Report', desc: 'Download bug reports, test cases, and Playwright scripts.', color: 'border-emerald-500/40 bg-emerald-500/5' },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className={`rounded-xl border p-6 ${step.color}`}
              >
                <div className="text-4xl font-black text-white/10 mb-4 font-mono">{step.step}</div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-white/40">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/5 via-violet-600/10 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-600/15 blur-[100px]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative text-center px-6"
        >
          <h2 className="text-5xl font-bold mb-4">
            Start finding bugs <span className="gradient-text">now.</span>
          </h2>
          <p className="text-white/40 text-lg mb-8">Free forever. No credit card required.</p>
          <Link href="/register">
            <GlowButton size="lg" icon={<Zap className="h-4 w-4" />}>
              Launch TestPilot AI
            </GlowButton>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <Zap className="h-4 w-4 text-violet-500" />
            TestPilot AI — Built for QA portfolio showcase
          </div>
          <div className="flex items-center gap-1 text-xs text-white/20">
            <Shield className="h-3 w-3" />
            SSRF protected · Rate limited · Open source
          </div>
        </div>
      </footer>
    </div>
  )
}
