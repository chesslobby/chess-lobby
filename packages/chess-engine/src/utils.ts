// Shared utility functions
export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function getTimeControlLabel(seconds: number): string {
  if (seconds === 0) return 'Untimed'
  if (seconds === 60) return '1 min — Bullet'
  if (seconds === 180) return '3 min — Blitz'
  if (seconds === 300) return '5 min — Blitz'
  if (seconds === 600) return '10 min — Rapid'
  return `${seconds}s`
}
