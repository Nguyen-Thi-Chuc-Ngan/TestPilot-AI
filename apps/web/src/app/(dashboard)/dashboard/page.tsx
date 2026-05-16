import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, Bug, FileText, Zap, Clock } from 'lucide-react'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch recent scan jobs
  const { data: recentScans } = await supabase
    .from('scan_jobs')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { count: totalScans } = await supabase
    .from('scan_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back. Ready to find some bugs?
        </p>
      </div>

      {/* Quick action */}
      <Link
        href="/scan/new"
        className="flex items-center justify-between rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 hover:border-primary/60 hover:bg-primary/10 transition-all group"
      >
        <div>
          <p className="font-semibold text-lg">Start a new scan</p>
          <p className="text-muted-foreground text-sm mt-0.5">
            Enter a URL and let AI find bugs, generate test cases, and write automation scripts.
          </p>
        </div>
        <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Zap className="h-4 w-4" />
            Total Scans
          </div>
          <p className="text-3xl font-bold">{totalScans ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Bug className="h-4 w-4" />
            Bugs Found
          </div>
          <p className="text-3xl font-bold">—</p>
        </div>
        <div className="rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <FileText className="h-4 w-4" />
            Reports Exported
          </div>
          <p className="text-3xl font-bold">—</p>
        </div>
      </div>

      {/* Recent scans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Scans</h2>
          <Link href="/history" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>

        {!recentScans || recentScans.length === 0 ? (
          <div className="rounded-xl border border-border border-dashed p-12 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium text-muted-foreground">No scans yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Your scan history will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentScans.map((scan) => (
              <Link
                key={scan.id}
                href={`/scan/${scan.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <StatusDot status={scan.status} />
                  <div>
                    <p className="text-sm font-medium truncate max-w-xs">{scan.url}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(scan.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: 'bg-green-500',
    running: 'bg-blue-500 animate-pulse',
    queued: 'bg-yellow-500',
    failed: 'bg-red-500',
  }
  return (
    <div className={`h-2 w-2 rounded-full ${colors[status] ?? 'bg-muted-foreground'}`} />
  )
}
