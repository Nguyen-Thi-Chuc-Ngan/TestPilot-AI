import { InterviewTrainer } from '@/components/interview/interview-trainer'

export const metadata = { title: 'AI Interview Trainer' }

export default function InterviewPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Interview Trainer</h1>
        <p className="text-muted-foreground mt-1">
          Practice QA interviews with AI that grades your answers like a senior interviewer.
        </p>
      </div>
      <InterviewTrainer />
    </div>
  )
}
