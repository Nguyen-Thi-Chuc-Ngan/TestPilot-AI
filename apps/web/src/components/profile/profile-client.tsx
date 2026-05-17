'use client'

import type { User } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import { Zap, Bug, BookOpen, Mic, Star, Shield, Eye, Code2, Search, Trophy, TrendingUp } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { useLang } from '@/stores/language-store'
import { cn } from '@/lib/utils'

interface Stats {
  totalScans: number
  totalFindings: number
  totalNotes: number
  totalInterviews: number
  avgInterviewScore: number
}

interface Badge {
  id: string
  icon: React.ElementType
  name: string
  name_vi: string
  desc: string
  desc_vi: string
  color: string
  earned: boolean
}

function getBadges(stats: Stats): Badge[] {
  return [
    { id: 'b1', icon: Zap,     name: 'First Scan',           name_vi: 'Lần Quét Đầu',       desc: 'Completed your first scan',              desc_vi: 'Hoàn thành lần quét đầu tiên',        color: 'text-violet-400 bg-violet-500/15', earned: stats.totalScans >= 1 },
    { id: 'b2', icon: Bug,     name: 'Bug Slayer',            name_vi: 'Thợ Săn Bug',         desc: 'Found 10+ bugs across scans',            desc_vi: 'Tìm được 10+ bugs',                   color: 'text-red-400 bg-red-500/15',      earned: stats.totalFindings >= 10 },
    { id: 'b3', icon: Shield,  name: 'Accessibility Guardian',name_vi: 'Bảo Vệ A11y',         desc: 'Completed 5+ scans',                     desc_vi: 'Hoàn thành 5+ lần quét',              color: 'text-yellow-400 bg-yellow-500/15',earned: stats.totalScans >= 5 },
    { id: 'b4', icon: BookOpen,name: 'Knowledge Keeper',      name_vi: 'Người Ghi Chép',       desc: 'Created 5+ QA notes',                    desc_vi: 'Tạo 5+ ghi chú QA',                  color: 'text-emerald-400 bg-emerald-500/15',earned: stats.totalNotes >= 5 },
    { id: 'b5', icon: Mic,     name: 'Interview Ready',       name_vi: 'Sẵn Phỏng Vấn',       desc: 'Completed 10+ interview sessions',        desc_vi: 'Hoàn thành 10+ phiên phỏng vấn',     color: 'text-orange-400 bg-orange-500/15',earned: stats.totalInterviews >= 10 },
    { id: 'b6', icon: Star,    name: 'Top Performer',         name_vi: 'Xuất Sắc',             desc: 'Avg interview score 8+/10',              desc_vi: 'Điểm phỏng vấn trung bình 8+/10',    color: 'text-blue-400 bg-blue-500/15',    earned: stats.avgInterviewScore >= 8 },
    { id: 'b7', icon: Search,  name: 'Exploratory Master',    name_vi: 'Thám Hiểm Viên',       desc: 'Completed 20+ scans',                    desc_vi: 'Hoàn thành 20+ lần quét',             color: 'text-cyan-400 bg-cyan-500/15',    earned: stats.totalScans >= 20 },
    { id: 'b8', icon: Trophy,  name: 'QA Champion',           name_vi: 'Vô Địch QA',           desc: 'Found 50+ bugs total',                   desc_vi: 'Tìm được 50+ bugs tổng cộng',        color: 'text-pink-400 bg-pink-500/15',    earned: stats.totalFindings >= 50 },
  ]
}

function getQARank(stats: Stats): { rank: string; rank_vi: string; color: string; next: string } {
  const score = stats.totalScans * 2 + stats.totalFindings + stats.totalNotes * 3 + stats.totalInterviews
  if (score >= 200) return { rank: 'QA Architect',   rank_vi: 'Kiến Trúc Sư QA',  color: 'text-pink-400',    next: '' }
  if (score >= 100) return { rank: 'QA Expert',      rank_vi: 'Chuyên Gia QA',     color: 'text-violet-400',  next: 'QA Architect' }
  if (score >= 50)  return { rank: 'QA Engineer',    rank_vi: 'Kỹ Sư QA',          color: 'text-blue-400',    next: 'QA Expert' }
  if (score >= 20)  return { rank: 'QA Practitioner',rank_vi: 'Thực Hành Viên QA', color: 'text-emerald-400', next: 'QA Engineer' }
  return              { rank: 'QA Novice',        rank_vi: 'Người Mới QA',      color: 'text-yellow-400',  next: 'QA Practitioner' }
}

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.06 } } }

export function ProfileClient({ user, stats }: { user: User; stats: Stats }) {
  const { lang } = useLang()
  const badges = getBadges(stats)
  const rank = getQARank(stats)
  const displayName = user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'Tester'
  const earnedCount = badges.filter((b) => b.earned).length

  const t = (en: string, vi: string) => lang === 'vi' ? vi : en

  const statCards = [
    { icon: Zap,       label: t('Total Scans',       'Tổng quét'),   value: stats.totalScans,        color: 'text-violet-500' },
    { icon: Bug,       label: t('Bugs Found',        'Bug tìm được'),value: stats.totalFindings,     color: 'text-red-500' },
    { icon: BookOpen,  label: t('QA Notes',          'Ghi chú QA'),  value: stats.totalNotes,        color: 'text-emerald-500' },
    { icon: Mic,       label: t('Interviews',        'Phỏng vấn'),   value: stats.totalInterviews,   color: 'text-orange-500' },
    { icon: TrendingUp,label: t('Avg Score',         'Điểm TB'),     value: stats.avgInterviewScore, color: 'text-blue-500', suffix: '/10' },
    { icon: Trophy,    label: t('Badges Earned',     'Huy hiệu'),    value: earnedCount,             color: 'text-pink-500', suffix: `/${badges.length}` },
  ]

  return (
    <div className="space-y-8">
      {/* Header card */}
      <motion.div initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeUp}>
          <GlassCard className="p-6">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-2xl font-bold text-violet-400 flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn('text-sm font-bold', rank.color)}>
                    {lang === 'vi' ? rank.rank_vi : rank.rank}
                  </span>
                  {rank.next && (
                    <span className="text-xs text-muted-foreground">
                      → {lang === 'vi' ? rank.rank_vi : rank.next}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">{t('Badges', 'Huy hiệu')}</div>
                <div className="text-3xl font-bold text-violet-400">{earnedCount}<span className="text-lg text-muted-foreground">/{badges.length}</span></div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          {statCards.map((s) => (
            <GlassCard key={s.label} className="p-4 text-center">
              <s.icon className={cn('h-4 w-4 mx-auto mb-2', s.color)} />
              <div className={cn('text-xl font-bold', s.color)}>
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
            </GlassCard>
          ))}
        </motion.div>
      </motion.div>

      {/* Badges */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <h2 className="font-bold">{t('Badges', 'Huy Hiệu')}</h2>
          <span className="text-xs text-muted-foreground">{earnedCount}/{badges.length} {t('earned', 'đạt được')}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              <GlassCard className={cn('p-4 text-center transition-all', !badge.earned && 'opacity-35 grayscale')}>
                <div className={cn('inline-flex rounded-xl p-3 mb-3', badge.color)}>
                  <badge.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold leading-tight">
                  {lang === 'vi' ? badge.name_vi : badge.name}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                  {lang === 'vi' ? badge.desc_vi : badge.desc}
                </p>
                {badge.earned && (
                  <div className="mt-2 text-[10px] text-emerald-500 font-bold">✓ {t('Earned', 'Đạt được')}</div>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
