import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  const { count: totalFindings } = await supabase
    .from('findings')
    .select('*', { count: 'exact', head: true })
    .in('job_id', (recentScans ?? []).map((s) => s.id))

  return (
    <DashboardClient
      recentScans={recentScans ?? []}
      totalScans={totalScans ?? 0}
      totalFindings={totalFindings ?? 0}
    />
  )
}
