import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/layout/page-header'

export const metadata = { title: 'AI Interview Trainer' }

const InterviewTrainer = dynamic(
  () => import('@/components/interview/interview-trainer').then((m) => m.InterviewTrainer),
  {
    ssr: false,
    loading: () => <div className="h-64 rounded-xl border border-border animate-pulse bg-muted/30" />,
  }
)

export default function InterviewPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader titleKey="interviewTitle" descKey="interviewDesc" />
      <InterviewTrainer />
    </div>
  )
}
