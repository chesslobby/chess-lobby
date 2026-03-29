import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chess Tournaments — Arena & Swiss',
  description: 'Join arena and Swiss chess tournaments on Chess Lobby. Compete against other players, earn title badges, and win prizes.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
