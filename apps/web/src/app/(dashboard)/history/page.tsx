import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'

export const metadata = { title: 'Scan History' }

export default async function HistoryPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: scans } = await supabase
    .from('scan_jobs')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scan History</h1>
        <p className="text-muted-foreground mt-1">All your previous website scans.</p>
      </div>

      {!scans || scans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-medium text-muted-foreground">No scans yet</p>
          <Link href="/scan/new" className="text-sm text-primary hover:underline mt-2 inline-block">
            Start your first scan
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {scans.map((scan) => (
            <Link
              key={scan.id}
              href={`/scan/${scan.id}`}
              className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <StatusBadge status={scan.status} />
                <div>
                  <p className="text-sm font-medium">{scan.url}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(scan.created_at).toLocaleString()} ·{' '}
                    {scan.mode ?? 'full'} mode
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-green-500/10 text-green-600 border-green-200',
    running: 'bg-blue-500/10 text-blue-600 border-blue-200',
    queued: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    failed: 'bg-red-500/10 text-red-600 border-red-200',
  }
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${styles[status] ?? 'bg-muted text-muted-foreground'}`}
    >
      {status}
    </span>
  )
}
