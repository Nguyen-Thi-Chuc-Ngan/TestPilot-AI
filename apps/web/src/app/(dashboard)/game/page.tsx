import { GameArena } from '@/components/game/game-arena'

export const metadata = { title: 'Game Testing Arena' }

export default function GamePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Game Testing Arena</h1>
        <p className="text-muted-foreground mt-1">
          Find bugs in intentionally broken apps. The more you find, the higher you score.
        </p>
      </div>
      <GameArena />
    </div>
  )
}
