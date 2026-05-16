'use client'

import { useEffect, useState } from 'react'
import { useLang } from '@/stores/language-store'

const translations = {
  en: {
    gameTitle: 'Game Testing Arena',
    gameDesc: 'Find bugs in intentionally broken apps. The more you find, the higher you score.',
    interviewTitle: 'AI Interview Trainer',
    interviewDesc: 'Practice QA interviews with AI that grades your answers like a senior interviewer.',
    newScanTitle: 'New Scan',
    newScanDesc: 'Enter a URL and AI will analyze it for bugs, generate test cases, and write automation scripts.',
  },
  vi: {
    gameTitle: 'Game Tìm Lỗi',
    gameDesc: 'Tìm bug trong các app cố ý có lỗi. Tìm được nhiều, điểm càng cao.',
    interviewTitle: 'Luyện Phỏng Vấn AI',
    interviewDesc: 'Luyện phỏng vấn QA với AI chấm điểm như senior interviewer thật.',
    newScanTitle: 'Quét mới',
    newScanDesc: 'Nhập URL và AI sẽ phân tích lỗi, tạo test case và viết automation script.',
  },
} as const

type HeaderKey = keyof typeof translations.en

interface Props {
  titleKey: HeaderKey
  descKey: HeaderKey
}

export function PageHeader({ titleKey, descKey }: Props) {
  const { lang } = useLang()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Render English on server/before mount to avoid hydration mismatch
  const tx = mounted ? (translations[lang] ?? translations.en) : translations.en

  return (
    <div>
      <h1 className="text-2xl font-bold">{tx[titleKey]}</h1>
      <p className="text-muted-foreground mt-1">{tx[descKey]}</p>
    </div>
  )
}
