import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ScanProgress } from '@/components/scan/scan-progress'
import { ReportTabs } from '@/components/report/report-tabs'
import { RescanButton } from '@/components/scan/rescan-button'

interface Props {
  params: { jobId: string }
}

export async function generateMetadata({ params }: Props) {
  return { title: `Scan ${params.jobId.slice(0, 8)}` }
}

export default async function ScanDetailPage({ params }: Props) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: job } = await supabase
    .from('scan_jobs')
    .select('*')
    .eq('id', params.jobId)
    .eq('user_id', user.id)
    .single()

  if (!job) notFound()

  if (job.status === 'completed') {
    const { data: findings } = await supabase
      .from('findings')
      .select('*')
      .eq('job_id', job.id)

    const { data: testCases } = await supabase
      .from('test_cases')
      .select('*')
      .eq('job_id', job.id)

    const { data: bugReports } = await supabase
      .from('bug_reports')
      .select('*, findings(*)')
      .eq('job_id', job.id)

    const { data: artifacts } = await supabase
      .from('artifacts')
      .select('*')
      .eq('job_id', job.id)

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Scan Report</h1>
            <p className="text-muted-foreground text-sm mt-1 font-mono truncate max-w-xl">{job.url}</p>
          </div>
          <RescanButton job={job} />
        </div>
        <ReportTabs
          job={job}
          findings={findings ?? []}
          testCases={testCases ?? []}
          bugReports={bugReports ?? []}
          artifacts={artifacts ?? []}
        />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <ScanProgress job={job} />
    </div>
  )
}
