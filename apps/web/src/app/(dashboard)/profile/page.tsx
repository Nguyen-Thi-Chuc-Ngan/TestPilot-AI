import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileClient } from '@/components/profile/profile-client'

export const metadata = { title: 'QA Profile' }

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { count: totalScans } = await supabase
    .from('scan_jobs').select('*', { count: 'exact', head: true }).eq('user_id', user.id)

  const { data: userScans } = await supabase
    .from('scan_jobs').select('id').eq('user_id', user.id)

  const scanIds = (userScans ?? []).map((s) => s.id)

  const { count: totalFindings } = scanIds.length
    ? await supabase.from('findings').select('*', { count: 'exact', head: true }).in('job_id', scanIds)
    : { count: 0 }

  const { count: totalNotes } = await supabase
    .from('qa_notes').select('*', { count: 'exact', head: true }).eq('user_id', user.id)

  const { count: totalInterviews } = await supabase
    .from('interview_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id)

  const { data: recentInterviews } = await supabase
    .from('interview_sessions').select('score').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)

  const avgScore = recentInterviews?.length
    ? Math.round(recentInterviews.reduce((a, b) => a + (b.score ?? 0), 0) / recentInterviews.length)
    : 0

  return (
    <ProfileClient
      user={user}
      stats={{
        totalScans: totalScans ?? 0,
        totalFindings: totalFindings ?? 0,
        totalNotes: totalNotes ?? 0,
        totalInterviews: totalInterviews ?? 0,
        avgInterviewScore: avgScore,
      }}
    />
  )
}
