import { GameArena } from '@/components/game/game-arena'
import { PageHeader } from '@/components/layout/page-header'

export const metadata = { title: 'Game Testing Arena' }

export default function GamePage() {
  return (
    <div className="space-y-6">
      <PageHeader titleKey="gameTitle" descKey="gameDesc" />
      <GameArena />
    </div>
  )
}
