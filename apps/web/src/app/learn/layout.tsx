import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chess Academy — Learn Chess Online',
  description: 'Learn chess with structured lessons. Opening explorer, endgame practice, puzzle rush, game analysis, and tactics trainer all in one place.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
