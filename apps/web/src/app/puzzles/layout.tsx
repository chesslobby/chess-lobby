import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Daily Chess Puzzles & Tactics',
  description: 'Solve daily chess puzzles and improve your tactical vision. Track your streak, compete with players worldwide. Puzzles rated 900–1700 Elo.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
