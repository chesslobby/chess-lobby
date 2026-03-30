const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || 'chesslobby-admin-2026'

export async function adminFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}/admin${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_KEY,
      ...(options.headers as Record<string, string> || {}),
    },
  })
  if (!res.ok) throw new Error(`Admin API error: ${res.status}`)
  return res.json()
}
