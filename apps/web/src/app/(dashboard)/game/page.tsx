import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/layout/page-header'

export const metadata = { title: 'Game Testing Arena' }

const GameArena = dynamic(() => import('@/components/game/game-arena').then((m) => m.GameArena), {
  ssr: false,
  loading: () => <div className="h-64 rounded-xl border border-border animate-pulse bg-muted/30" />,
})

export default function GamePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader titleKey="gameTitle" descKey="gameDesc" />
      <GameArena />
    </div>
  )
}
