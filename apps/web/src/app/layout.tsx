import type { Metadata } from 'next'
import { Playfair_Display, Crimson_Pro } from 'next/font/google'
import Script from 'next/script'
import ToastContainer from '@/components/Toast'

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
  title: {
    default: 'Chess Lobby — Play Chess Online Free | Voice Chat + Real-time',
    template: '%s | Chess Lobby',
  },
  description: 'Play chess online free with voice chat! Real-time multiplayer chess with friends or strangers. Elo rating, tournaments, daily puzzles, game analysis, AI bot opponent. No download required.',
  keywords: [
    'chess online', 'play chess free', 'chess with voice chat',
    'multiplayer chess', 'chess game', 'chess lobby', 'online chess',
    'chess puzzles', 'chess tournaments', 'chess analysis',
    'play chess vs computer', 'chess AI', 'stockfish chess',
  ],
  authors: [{ name: 'Chess Lobby' }],
  creator: 'Chess Lobby',
  publisher: 'Chess Lobby',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://chesslobby.in',
    siteName: 'Chess Lobby',
    title: 'Chess Lobby — Play Chess Online Free with Voice Chat',
    description: 'Real-time multiplayer chess with voice chat, Elo rating, tournaments, daily puzzles, game analysis, and AI bot. Play free, no download!',
    images: [{ url: 'https://chesslobby.in/og-image.png', width: 1200, height: 630, alt: 'Chess Lobby — Play Chess Online' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chess Lobby — Play Chess Online Free',
    description: 'Real-time multiplayer chess with voice chat! Play free at chesslobby.in',
    images: ['https://chesslobby.in/og-image.png'],
    creator: '@chesslobby',
  },
  alternates: { canonical: 'https://chesslobby.in' },
  manifest: '/manifest.json',
  themeColor: '#c9a84c',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${crimson.variable}`}>
      <head>
        <link rel="preconnect" href="https://chess-lobby-server.onrender.com" />
        <link rel="dns-prefetch" href="https://chess-lobby-server.onrender.com" />
        <link rel="preconnect" href="https://cifvbhtelyqyvwtfnsur.supabase.co" />
        <link rel="dns-prefetch" href="https://cifvbhtelyqyvwtfnsur.supabase.co" />
      </head>
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
        <ToastContainer />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8306823140109021"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-6SZ1ZJX749"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-6SZ1ZJX749', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </body>
    </html>
  )
}
