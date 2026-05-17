import { InterviewTrainer } from '@/components/interview/interview-trainer'
import { PageHeader } from '@/components/layout/page-header'

export const metadata = { title: 'AI Interview Trainer' }

export default function InterviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader titleKey="interviewTitle" descKey="interviewDesc" />
      <InterviewTrainer />
    </div>
  )
}
