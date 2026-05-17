'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Zap, Bug, FileText, Code2, ArrowRight, Play, Shield, Star, ChevronRight, Terminal } from 'lucide-react'
import { AIActivityFeed } from '@/components/ui/ai-activity-feed'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { GlowButton } from '@/components/ui/glow-button'

// ── Demo data ──────────────────────────────────────────────────────────────
const DEMO_URL = 'https://demo-shop.testpilot.ai'

const SCAN_STEPS = [
  { label: 'Connecting to website',       duration: 800 },
  { label: 'Taking screenshots',          duration: 1200 },
  { label: 'Analyzing UI with AI',        duration: 2000 },
  { label: 'Generating test cases',       duration: 1500 },
  { label: 'Writing bug reports',         duration: 1200 },
  { label: 'Creating automation script',  duration: 1000 },
  { label: 'Finalizing report',           duration: 600 },
]

const ACTIVITY_LINES = [
  { type: 'info' as const,    message: 'Browser context initialized' },
  { type: 'info' as const,    message: 'Navigating to target URL...' },
  { type: 'ai' as const,      message: 'Capturing viewport + full-page screenshots' },
  { type: 'ai' as const,      message: 'Running axe-core accessibility audit' },
  { type: 'warn' as const,    message: 'WCAG AA violation: contrast ratio 2.1:1 on CTA button' },
  { type: 'ai' as const,      message: 'Sending screenshots to Llama 4 Scout Vision...' },
  { type: 'warn' as const,    message: 'Missing alt text on 3 product images' },
  { type: 'ai' as const,      message: 'Analyzing form validation patterns' },
  { type: 'error' as const,   message: 'Submit button disabled state unclear — P2 issue' },
  { type: 'ai' as const,      message: 'Generating 12 structured test cases...' },
  { type: 'ai' as const,      message: 'Writing Playwright automation script' },
  { type: 'success' as const, message: 'Report complete — 8 findings, 12 test cases' },
]

const DEMO_FINDINGS = [
  { id: '1', severity: 'high',   category: 'accessibility', title: 'CTA button contrast ratio fails WCAG AA', description: 'The primary call-to-action button has a contrast ratio of 2.1:1, well below the minimum 4.5:1 required by WCAG AA. Users with visual impairments will struggle to read it.', recommendation: 'Change button background from #a78bfa to #6d28d9 to achieve 7.2:1 contrast ratio.' },
  { id: '2', severity: 'high',   category: 'accessibility', title: 'Missing alt text on product images', description: '3 product images have empty or missing alt attributes, making them invisible to screen readers.', recommendation: 'Add descriptive alt text to all product images.' },
  { id: '3', severity: 'medium', category: 'usability',    title: 'No form validation feedback', description: 'The checkout form shows no inline error messages when fields are invalid — only an alert after submission.', recommendation: 'Add real-time validation with visible error states per field.' },
  { id: '4', severity: 'medium', category: 'layout',       title: 'Navigation collapses on 768px viewport', description: 'The navigation menu breaks at exactly 768px, overlapping with hero content.', recommendation: 'Fix the nav breakpoint to 769px or higher.' },
  { id: '5', severity: 'low',    category: 'typography',   title: 'Footer text too small', description: 'Footer copyright text is 10px — below the minimum 12px recommended for readability.', recommendation: 'Increase footer text size to at least 12px.' },
]

const DEMO_TEST_CASES = [
  { id: 'TC-001', title: 'Verify CTA button is visible to screen readers', priority: 'high', category: 'accessibility' },
  { id: 'TC-002', title: 'Checkout flow with valid payment details', priority: 'high', category: 'functional' },
  { id: 'TC-003', title: 'Form submission with empty required fields', priority: 'high', category: 'negative' },
  { id: 'TC-004', title: 'Responsive layout at 320px, 768px, 1440px', priority: 'medium', category: 'ui' },
  { id: 'TC-005', title: 'Product image alt text verification', priority: 'medium', category: 'accessibility' },
]

const STATS = [
  { label: 'Findings',    value: 8,   color: 'text-red-400' },
  { label: 'Test Cases',  value: 12,  color: 'text-blue-400' },
  { label: 'Scan time',   value: '8s', color: 'text-violet-400', isText: true },
  { label: 'Score',       value: '64/100', color: 'text-yellow-400', isText: true },
]

type Phase = 'idle' | 'scanning' | 'report'

export default function ShowcasePage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [currentStep, setCurrentStep] = useState(0)
  const [activeTab, setActiveTab] = useState<'findings' | 'testcases' | 'script'>('findings')

  function startDemo() {
    setPhase('scanning')
    setCurrentStep(0)
    let step = 0
    const runStep = () => {
      if (step >= SCAN_STEPS.length) {
        setPhase('report')
        return
      }
      setCurrentStep(step)
      step++
      setTimeout(runStep, SCAN_STEPS[step - 1]?.duration ?? 1000)
    }
    runStep()
  }

  function reset() {
    setPhase('idle')
    setCurrentStep(0)
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-violet-600/8 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/5 blur-[100px]" />
        <div className="grid-pattern absolute inset-0 opacity-30" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/5 bg-black/30 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">TestPilot <span className="text-violet-400">AI</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
              Portfolio Demo Mode
            </div>
            <Link href="/register">
              <GlowButton size="sm">
                Get started free <ArrowRight className="h-3.5 w-3.5" />
              </GlowButton>
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
            <Shield className="h-3 w-3 text-violet-400" />
            Built for QA portfolio showcase — recruiter-ready demo
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            AI-Powered QA
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-blue-400 to-emerald-400">
              in 8 seconds
            </span>
          </h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Watch TestPilot AI scan any website, find bugs, generate test cases,
            and write automation scripts — live.
          </p>
        </motion.div>

        {/* Demo terminal */}
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden"
            >
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-white/30 font-mono ml-2">testpilot — ready</span>
              </div>
              <div className="p-8 text-center space-y-6">
                <div className="inline-flex h-20 w-20 rounded-2xl bg-violet-600/20 border border-violet-500/30 items-center justify-center">
                  <Terminal className="h-10 w-10 text-violet-400" />
                </div>
                <div>
                  <p className="text-white/60 mb-1">Target: <span className="text-violet-400 font-mono">{DEMO_URL}</span></p>
                  <p className="text-sm text-white/30">Click to run a live AI scan demonstration</p>
                </div>
                <GlowButton onClick={startDemo} size="lg" icon={<Play className="h-4 w-4" />}>
                  Run Live Demo
                </GlowButton>
              </div>
            </motion.div>
          )}

          {phase === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            >
              {/* Steps */}
              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Pipeline</p>
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-3 w-3 rounded-full border-2 border-violet-400 border-t-transparent"
                    />
                    <span className="text-xs text-violet-400 font-mono">RUNNING</span>
                  </div>
                </div>
                <div className="h-1 bg-white/5 rounded-full mb-5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
                    animate={{ width: `${(currentStep / SCAN_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="space-y-3">
                  {SCAN_STEPS.map((step, i) => {
                    const done   = i < currentStep
                    const active = i === currentStep
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-5">
                          {done   && <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center"><span className="text-[8px] text-white font-bold">✓</span></div>}
                          {active && <motion.div animate={{ scale: [1,1.3,1] }} transition={{ duration: 0.8, repeat: Infinity }} className="h-4 w-4 rounded-full border-2 border-violet-400" />}
                          {!done && !active && <div className="h-4 w-4 rounded-full border border-white/10" />}
                        </div>
                        <span className={`text-sm ${done ? 'text-white/25 line-through' : active ? 'text-white font-medium' : 'text-white/20'}`}>
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* AI Activity */}
              <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest">AI Activity Log</p>
                  <span className="text-[10px] text-emerald-400 font-mono">● LIVE</span>
                </div>
                <AIActivityFeed lines={ACTIVITY_LINES} maxLines={12} />
              </div>
            </motion.div>
          )}

          {phase === 'report' && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Stats bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {STATS.map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-center">
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-white/40 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Report tabs */}
              <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
                {/* Tab bar */}
                <div className="flex border-b border-white/[0.06]">
                  {(['findings', 'testcases', 'script'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative ${activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                    >
                      {tab === 'findings'  && <Bug className="h-3.5 w-3.5" />}
                      {tab === 'testcases' && <FileText className="h-3.5 w-3.5" />}
                      {tab === 'script'    && <Code2 className="h-3.5 w-3.5" />}
                      {tab === 'findings'  ? 'Findings (8)'  : tab === 'testcases' ? 'Test Cases (12)' : 'Playwright Script'}
                      {activeTab === tab && (
                        <motion.div layoutId="showcase-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-blue-500" />
                      )}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center gap-2 px-4">
                    <button className="text-xs text-white/30 hover:text-white/60 border border-white/10 rounded px-2 py-1 transition-colors">↓ MD</button>
                    <button className="text-xs text-white/30 hover:text-white/60 border border-white/10 rounded px-2 py-1 transition-colors">↓ HTML</button>
                  </div>
                </div>

                <div className="p-5">
                  {activeTab === 'findings' && (
                    <div className="space-y-2">
                      {DEMO_FINDINGS.map((f, i) => (
                        <motion.div
                          key={f.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <SeverityBadge severity={f.severity} />
                            <span className="text-[10px] rounded border border-white/10 bg-white/5 px-2 py-0.5 text-white/50">{f.category}</span>
                            <span className="text-sm font-medium ml-1">{f.title}</span>
                          </div>
                          <p className="text-xs text-white/40 leading-relaxed">{f.description}</p>
                          <div className="mt-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2">
                            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Fix: </span>
                            <span className="text-xs text-white/50">{f.recommendation}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'testcases' && (
                    <div className="space-y-2">
                      {DEMO_TEST_CASES.map((tc, i) => (
                        <motion.div
                          key={tc.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3"
                        >
                          <span className="text-xs font-mono text-white/30 w-16 flex-shrink-0">{tc.id}</span>
                          <span className="flex-1 text-sm">{tc.title}</span>
                          <span className={`text-[10px] font-bold rounded px-2 py-0.5 ${tc.priority === 'high' ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                            {tc.priority}
                          </span>
                          <span className="text-[10px] text-white/30 bg-white/5 rounded px-2 py-0.5">{tc.category}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'script' && (
                    <pre className="text-xs text-emerald-400/80 font-mono bg-black/40 rounded-xl p-4 overflow-x-auto leading-relaxed">
{`import { test, expect } from '@playwright/test'

test.describe('${DEMO_URL} — AI Generated Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('${DEMO_URL}')
  })

  test('TC-001: CTA button accessible to screen readers', async ({ page }) => {
    const btn = page.getByRole('button', { name: /buy now|add to cart/i })
    await expect(btn).toBeVisible()
    await expect(btn).toHaveAttribute('aria-label')
  })

  test('TC-002: Checkout flow with valid details', async ({ page }) => {
    await page.getByRole('button', { name: /checkout/i }).click()
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Card number').fill('4242 4242 4242 4242')
    await page.getByRole('button', { name: /pay/i }).click()
    await expect(page.getByText(/thank you/i)).toBeVisible()
  })

  test('TC-003: Form validation on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: /checkout/i }).click()
    await page.getByRole('button', { name: /pay/i }).click()
    await expect(page.getByText(/required/i)).toBeVisible()
  })
})`}
                    </pre>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={reset} className="text-sm text-white/30 hover:text-white/60 transition-colors">
                  ← Run again
                </button>
                <Link href="/register">
                  <GlowButton icon={<Zap className="h-4 w-4" />}>
                    Scan your own website free
                    <ArrowRight className="h-4 w-4" />
                  </GlowButton>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features grid */}
        {phase === 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Bug,      title: '8 Findings',       desc: 'UI/UX bugs by severity',      color: 'text-red-400 bg-red-500/10' },
                { icon: FileText, title: '12 Test Cases',    desc: 'Structured QA test cases',    color: 'text-blue-400 bg-blue-500/10' },
                { icon: Code2,    title: 'Playwright Script', desc: 'Ready-to-run automation',    color: 'text-emerald-400 bg-emerald-500/10' },
              ].map((f) => (
                <div key={f.title} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 flex items-center gap-3">
                  <div className={`rounded-lg p-2.5 ${f.color}`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{f.title}</p>
                    <p className="text-xs text-white/40">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
