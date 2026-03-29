export function getTitle(elo: number): { title: string; color: string; icon: string } {
  if (elo >= 2000) return { title: 'Master',   color: '#ff6b35', icon: '🔱' }
  if (elo >= 1800) return { title: 'Expert',   color: '#9b59b6', icon: '👑' }
  if (elo >= 1500) return { title: 'Advanced', color: '#3498db', icon: '💎' }
  if (elo >= 1300) return { title: 'Club',     color: '#27ae60', icon: '⚔️' }
  if (elo >= 1100) return { title: 'Casual',   color: '#f39c12', icon: '🎯' }
  return                   { title: 'Beginner',color: '#95a5a6', icon: '♟️' }
}

export function getTitleBadge(elo: number): string {
  const { icon, title } = getTitle(elo)
  return `${icon} ${title}`
}
