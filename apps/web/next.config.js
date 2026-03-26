/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@royal-chess/chess-engine', '@royal-chess/config'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
}
module.exports = nextConfig
