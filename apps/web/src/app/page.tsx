import Link from 'next/link'
import { ArrowRight, Zap, Bug, FileCode, Brain, Gamepad2, Mic } from 'lucide-react'

const features = [
  {
    icon: Bug,
    title: 'AI Bug Hunter',
    description: 'Vision AI scans your UI screenshots and surfaces real issues with severity ratings.',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  {
    icon: FileCode,
    title: 'Test Case Generator',
    description: 'From URL or requirements, get structured QA test cases ready for Jira.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Zap,
    title: 'Playwright Script',
    description: 'Auto-generate runnable Playwright TypeScript automation scripts.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: Brain,
    title: 'AI Roast Mode',
    description: 'Savage but constructive UX feedback that makes devs actually fix things.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Gamepad2,
    title: 'Game Testing Arena',
    description: 'Find bugs in intentionally broken mini games. Compete for the highest score.',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    icon: Mic,
    title: 'Interview Trainer',
    description: 'Practice QA interviews with AI that grades your answers like a senior interviewer.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">TestPilot AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get started free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-8">
          <Zap className="h-3.5 w-3.5" />
          Powered by Google Gemini Vision
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent md:text-6xl">
          AI-Powered QA
          <br />
          Testing Platform
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Enter any URL and get AI-generated test cases, bug reports, and Playwright automation
          scripts in under 60 seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start scanning free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-medium hover:bg-muted transition-colors"
          >
            View demo
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Everything a QA needs</h2>
          <p className="text-muted-foreground text-lg">
            Six AI-powered modules, one platform.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border p-6 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className={`inline-flex rounded-lg p-2.5 mb-4 ${f.bg}`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>TestPilot AI — Built for QA portfolio showcase</p>
        </div>
      </footer>
    </div>
  )
}
