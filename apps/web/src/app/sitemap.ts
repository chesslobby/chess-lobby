import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://chesslobby.in',              lastModified: new Date(), changeFrequency: 'daily',   priority: 1   },
    { url: 'https://chesslobby.in/lobby',         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: 'https://chesslobby.in/play-bot',      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: 'https://chesslobby.in/puzzles',       lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: 'https://chesslobby.in/learn',         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: 'https://chesslobby.in/openings',      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: 'https://chesslobby.in/endgames',      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: 'https://chesslobby.in/tournaments',   lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
    { url: 'https://chesslobby.in/leaderboard',   lastModified: new Date(), changeFrequency: 'daily',   priority: 0.6 },
    { url: 'https://chesslobby.in/login',         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://chesslobby.in/register',      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]
}
