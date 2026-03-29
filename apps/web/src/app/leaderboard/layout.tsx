import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chess Leaderboard — Top Players',
  description: 'See the top chess players on Chess Lobby. Compete to reach the global rankings. Updated live based on Elo rating.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
