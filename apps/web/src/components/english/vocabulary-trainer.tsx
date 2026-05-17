'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronRight, Check, X, RotateCcw, Filter } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowButton } from '@/components/ui/glow-button'
import { QA_VOCABULARY, VOCABULARY_CATEGORIES, type VocabWord } from '@/lib/english/qa-vocabulary'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'

type Mode = 'browse' | 'flashcard' | 'quiz'

interface Props { lang: string }

export function VocabularyTrainer({ lang }: Props) {
  const [mode, setMode]             = useState<Mode>('browse')
  const [category, setCategory]     = useState('All')
  const [cardIdx, setCardIdx]       = useState(0)
  const [flipped, setFlipped]       = useState(false)
  const [quizIdx, setQuizIdx]       = useState(0)
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null)
  const [score, setScore]           = useState(0)
  const [done, setDone]             = useState(false)

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  const filtered = useMemo(() =>
    category === 'All' ? QA_VOCABULARY : QA_VOCABULARY.filter((w) => w.category === category),
    [category])

  // Shuffle for flashcard/quiz
  const shuffled = useMemo(() => [...filtered].sort(() => Math.random() - 0.5), [filtered, mode])

  function nextCard() { setCardIdx((i) => (i + 1) % shuffled.length); setFlipped(false) }
  function prevCard() { setCardIdx((i) => (i - 1 + shuffled.length) % shuffled.length); setFlipped(false) }

  // Quiz: 4 options for each word
  const currentQuiz = shuffled[quizIdx]
  const quizOptions = useMemo(() => {
    if (!currentQuiz) return []
    const others = filtered.filter((w) => w.word !== currentQuiz.word)
      .sort(() => Math.random() - 0.5).slice(0, 3)
    return [...others, currentQuiz].sort(() => Math.random() - 0.5)
  }, [quizIdx, shuffled])

  function handleQuizAnswer(word: VocabWord) {
    const correct = word.word === currentQuiz.word
    setQuizAnswer(word.word)
    if (correct) setScore((s) => s + 1)
    apiClient.post('/api/english/vocab/record', { word: currentQuiz.word, category: currentQuiz.category, correct }).catch(() => {})
    setTimeout(() => {
      if (quizIdx + 1 >= Math.min(shuffled.length, 10)) { setDone(true); return }
      setQuizIdx((i) => i + 1)
      setQuizAnswer(null)
    }, 1200)
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {['All', ...VOCABULARY_CATEGORIES].map((cat) => (
            <button key={cat} onClick={() => { setCategory(cat); setCardIdx(0); setQuizIdx(0); setQuizAnswer(null); setDone(false) }}
              className={cn('rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all',
                category === cat ? 'bg-violet-600 text-white border-violet-500' : 'border-border text-muted-foreground hover:bg-muted')}>
              {cat}
            </button>
          ))}
        </div>

        {/* Mode selector */}
        <div className="flex gap-1">
          {(['browse', 'flashcard', 'quiz'] as Mode[]).map((m) => (
            <button key={m} onClick={() => { setMode(m); setCardIdx(0); setQuizIdx(0); setQuizAnswer(null); setDone(false); setScore(0) }}
              className={cn('rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-all',
                mode === m ? 'bg-blue-600 text-white border-blue-500' : 'border-border text-muted-foreground hover:bg-muted')}>
              {m === 'browse' ? t('Browse', 'Duyệt') : m === 'flashcard' ? t('Flashcard', 'Thẻ học') : t('Quiz', 'Kiểm tra')}
            </button>
          ))}
        </div>
      </div>

      {/* BROWSE MODE */}
      {mode === 'browse' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((word, i) => (
            <motion.div key={word.word} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <GlassCard className="p-4 h-full">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-base text-violet-500">{word.word}</h3>
                  <span className="text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground flex-shrink-0 ml-2">{word.category}</span>
                </div>
                <p className="text-sm text-foreground/80 mb-2">{word.definition}</p>
                <p className="text-xs text-muted-foreground italic">&ldquo;{word.example}&rdquo;</p>
                {word.example_vi && (
                  <p className="text-xs text-blue-400/70 mt-1">→ {word.example_vi}</p>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* FLASHCARD MODE */}
      {mode === 'flashcard' && shuffled.length > 0 && (
        <div className="space-y-4">
          <div className="text-center text-xs text-muted-foreground">
            {cardIdx + 1} / {shuffled.length}
          </div>

          <div className="flex justify-center">
            <motion.div
              className="w-full max-w-lg cursor-pointer"
              onClick={() => setFlipped(!flipped)}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.4 }}
              style={{ perspective: 1000 }}
            >
              <div className="relative h-56">
                {/* Front */}
                <div className={cn('absolute inset-0 rounded-2xl border border-violet-500/30 bg-violet-500/5 flex flex-col items-center justify-center p-6 text-center', flipped && 'opacity-0 pointer-events-none')}>
                  <p className="text-3xl font-black text-violet-400 mb-2">{shuffled[cardIdx].word}</p>
                  <p className="text-xs text-muted-foreground">{shuffled[cardIdx].category}</p>
                  <p className="text-xs text-muted-foreground/50 mt-4">{t('Click to see definition', 'Bấm để xem định nghĩa')}</p>
                </div>
                {/* Back */}
                <div className={cn('absolute inset-0 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col items-center justify-center p-6 text-center', !flipped && 'opacity-0 pointer-events-none')}
                  style={{ transform: 'rotateY(180deg)' }}>
                  <p className="text-sm font-semibold text-foreground mb-2">{shuffled[cardIdx].definition}</p>
                  <p className="text-xs text-muted-foreground italic">&ldquo;{shuffled[cardIdx].example}&rdquo;</p>
                  {shuffled[cardIdx].example_vi && (
                    <p className="text-xs text-blue-400/70 mt-1">{shuffled[cardIdx].example_vi}</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex justify-center gap-3">
            <GlowButton variant="secondary" onClick={prevCard}>← {t('Prev', 'Trước')}</GlowButton>
            <GlowButton onClick={nextCard}>{t('Next', 'Tiếp')} →</GlowButton>
          </div>
        </div>
      )}

      {/* QUIZ MODE */}
      {mode === 'quiz' && !done && shuffled.length >= 4 && (
        <div className="space-y-5 max-w-xl mx-auto">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('Question', 'Câu')} {quizIdx + 1}/10</span>
            <span className="text-emerald-500 font-bold">{score} {t('correct', 'đúng')}</span>
          </div>

          <GlassCard className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">{t('Which word means:', 'Từ nào có nghĩa là:')}</p>
            <p className="text-lg font-bold text-foreground">{currentQuiz?.definition}</p>
            {currentQuiz?.example && (
              <p className="text-xs text-muted-foreground italic mt-2">&ldquo;{currentQuiz.example}&rdquo;</p>
            )}
          </GlassCard>

          <div className="grid grid-cols-2 gap-3">
            {quizOptions.map((opt) => {
              const isCorrect = opt.word === currentQuiz?.word
              const isSelected = quizAnswer === opt.word
              return (
                <button key={opt.word}
                  onClick={() => !quizAnswer && handleQuizAnswer(opt)}
                  disabled={!!quizAnswer}
                  className={cn('rounded-xl border p-3.5 text-sm font-semibold transition-all text-left',
                    !quizAnswer ? 'border-border hover:border-violet-500/50 hover:bg-violet-500/5' :
                    isCorrect ? 'border-emerald-500 bg-emerald-500/15 text-emerald-500' :
                    isSelected ? 'border-red-500 bg-red-500/15 text-red-500' :
                    'border-border opacity-40'
                  )}>
                  <div className="flex items-center justify-between">
                    {opt.word}
                    {quizAnswer && isCorrect && <Check className="h-4 w-4 text-emerald-500" />}
                    {quizAnswer && isSelected && !isCorrect && <X className="h-4 w-4 text-red-500" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* QUIZ DONE */}
      {mode === 'quiz' && done && (
        <GlassCard className="p-8 text-center space-y-4 max-w-xl mx-auto">
          <div className={cn('text-5xl font-black', score >= 8 ? 'text-emerald-500' : score >= 6 ? 'text-yellow-500' : 'text-red-500')}>
            {score}/10
          </div>
          <p className="text-lg font-bold">
            {score >= 8 ? t('Excellent! 🎉', 'Xuất sắc! 🎉') : score >= 6 ? t('Good job!', 'Tốt lắm!') : t('Keep practicing!', 'Tiếp tục luyện tập!')}
          </p>
          <GlowButton onClick={() => { setQuizIdx(0); setScore(0); setDone(false); setQuizAnswer(null) }} icon={<RotateCcw className="h-4 w-4" />}>
            {t('Try again', 'Thử lại')}
          </GlowButton>
        </GlassCard>
      )}
    </div>
  )
}
