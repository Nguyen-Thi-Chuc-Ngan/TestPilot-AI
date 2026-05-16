'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, ChevronRight, RotateCcw, Star } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { useLang } from '@/stores/language-store'

interface Feedback {
  score: number
  strengths: string[]
  improvements: string[]
  ideal_answer_hints: string[]
  follow_up_question: string
}

interface Question {
  id: string
  question: string
  question_vi: string
  category: string
}

const LEVELS = ['junior', 'mid', 'senior'] as const
type Level = (typeof LEVELS)[number]

const SAMPLE_QUESTIONS: Question[] = [
  { id: 'q1', question: 'What is the difference between severity and priority in bug reporting?', question_vi: 'Sự khác nhau giữa severity và priority trong bug report là gì?', category: 'fundamentals' },
  { id: 'q2', question: 'Describe your process for writing a test case from scratch.', question_vi: 'Mô tả quy trình viết test case từ đầu của bạn.', category: 'test-design' },
  { id: 'q3', question: 'How do you decide what to test when you have limited time before a release?', question_vi: 'Khi thời gian ít trước release, bạn ưu tiên test gì?', category: 'strategy' },
  { id: 'q4', question: 'What is boundary value analysis and when would you use it?', question_vi: 'Boundary value analysis là gì và khi nào dùng?', category: 'techniques' },
  { id: 'q5', question: 'How would you test a login form?', question_vi: 'Bạn sẽ test một form đăng nhập như thế nào?', category: 'practical' },
  { id: 'q6', question: 'Explain the difference between black-box and white-box testing.', question_vi: 'Giải thích sự khác nhau giữa black-box và white-box testing.', category: 'fundamentals' },
  { id: 'q7', question: 'How do you approach regression testing when features change frequently?', question_vi: 'Bạn xử lý regression testing khi feature thay đổi liên tục như thế nào?', category: 'strategy' },
  { id: 'q8', question: 'What makes a good bug report?', question_vi: 'Một bug report tốt cần có những gì?', category: 'fundamentals' },
  { id: 'q9', question: 'How would you test an API endpoint?', question_vi: 'Bạn sẽ test một API endpoint như thế nào?', category: 'api-testing' },
  { id: 'q10', question: 'Describe a time you found a critical bug late in the release cycle. How did you handle it?', question_vi: 'Kể về lần bạn tìm ra bug nghiêm trọng sát ngày release. Bạn xử lý thế nào?', category: 'behavioral' },
]

export function InterviewTrainer() {
  const { t, lang } = useLang()
  const [level, setLevel] = useState<Level>('junior')
  const [question, setQuestion] = useState<Question | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState } = useForm<{ answer: string }>()

  const levelLabels = {
    en: { junior: 'Junior', mid: 'Mid', senior: 'Senior' },
    vi: { junior: 'Mới ra trường', mid: 'Trung cấp', senior: 'Cao cấp' },
  }

  function pickQuestion() {
    const random = SAMPLE_QUESTIONS[Math.floor(Math.random() * SAMPLE_QUESTIONS.length)]
    setQuestion(random)
    setFeedback(null)
    reset()
  }

  async function onSubmit({ answer }: { answer: string }) {
    if (!question) return
    setLoading(true)
    try {
      const result = await apiClient.post<Feedback>('/api/interview/evaluate', {
        question_id: question.id,
        question: question.question,
        answer,
        level,
      })
      setFeedback(result)
    } catch {
      toast.error(lang === 'vi' ? 'Không lấy được phản hồi. Thử lại.' : 'Failed to get feedback. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const displayQuestion = lang === 'vi' ? question?.question_vi : question?.question

  return (
    <div className="space-y-6">
      {/* Level selector */}
      <div>
        <p className="text-sm font-medium mb-2">
          {lang === 'vi' ? 'Cấp độ của bạn' : 'Your level'}
        </p>
        <div className="flex gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                level === l ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted'
              }`}
            >
              {levelLabels[lang][l]}
            </button>
          ))}
        </div>
      </div>

      {!question ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {lang === 'vi' ? 'Sẵn sàng luyện phỏng vấn QA chưa?' : 'Ready to practice your QA interview skills?'}
          </p>
          <button
            onClick={pickQuestion}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t('getQuestion')}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {question.category}
              </span>
              <button
                onClick={pickQuestion}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                {lang === 'vi' ? 'Câu khác' : 'New question'}
              </button>
            </div>
            <p className="font-medium">{displayQuestion}</p>
          </div>

          {!feedback && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <textarea
                {...register('answer', {
                  required: lang === 'vi' ? 'Nhập câu trả lời' : 'Please write your answer',
                })}
                rows={6}
                placeholder={lang === 'vi' ? 'Gõ câu trả lời của bạn ở đây...' : 'Type your answer here...'}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              {formState.errors.answer && (
                <p className="text-destructive text-xs">{formState.errors.answer.message}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('getFeedback')}
              </button>
            </form>
          )}

          {feedback && (
            <div className="space-y-4">
              {/* Score */}
              <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < feedback.score ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/20'}`}
                    />
                  ))}
                </div>
                <p className="font-semibold text-lg">{feedback.score}/10</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 p-4">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">
                    {t('strengths')}
                  </p>
                  <ul className="space-y-1">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-green-800 dark:text-green-300 flex gap-2">
                        <span>•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-900/20 p-4">
                  <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wide mb-2">
                    {t('improvements')}
                  </p>
                  <ul className="space-y-1">
                    {feedback.improvements.map((s, i) => (
                      <li key={i} className="text-sm text-orange-800 dark:text-orange-300 flex gap-2">
                        <span>•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  {t('keyPoints')}
                </p>
                <ul className="space-y-1">
                  {feedback.ideal_answer_hints.map((h, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-muted-foreground">{i + 1}.</span> {h}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                  {t('followUp')}
                </p>
                <p className="text-sm italic">&ldquo;{feedback.follow_up_question}&rdquo;</p>
              </div>

              <button
                onClick={pickQuestion}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
                {t('nextQuestion')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
