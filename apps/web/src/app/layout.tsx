import type { Metadata } from 'next'
import { Playfair_Display, Crimson_Pro } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const crimson = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-crimson',
  weight: ['400', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Chess Lobby — Play, Talk, Win',
  description: 'Cross-platform chess lobby with voice and live chat. Play online, compete for Elo, and connect with players worldwide.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${crimson.variable}`}>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#0a1628',
          color: '#e8e0d0',
          fontFamily: 'var(--font-crimson), Georgia, serif',
        }}
      >
        {children}
      </body>
    </html>
  )
}
