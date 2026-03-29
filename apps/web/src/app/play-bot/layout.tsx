import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Play vs Computer — Chess AI Bot',
  description: 'Play chess against Stockfish AI engine in your browser. Choose from Beginner to Master difficulty. No download required — runs entirely client-side.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
