export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window === 'undefined') return
  if (!(window as any).gtag) return
  ;(window as any).gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

export const Analytics = {
  gameStarted: (timeControl: string) => trackEvent('game_started', 'gameplay', timeControl),
  gameCompleted: (result: string, moves: number) => trackEvent('game_completed', 'gameplay', result, moves),
  botGameStarted: (difficulty: string) => trackEvent('bot_game_started', 'gameplay', difficulty),
  userRegistered: () => trackEvent('sign_up', 'user', 'email'),
  userLoggedIn: (method: string) => trackEvent('login', 'user', method),
  guestPlayed: () => trackEvent('guest_play', 'user'),
  puzzleSolved: () => trackEvent('puzzle_solved', 'puzzles'),
  puzzleRushCompleted: (score: number) => trackEvent('puzzle_rush_completed', 'puzzles', undefined, score),
  tournamentJoined: () => trackEvent('tournament_joined', 'tournaments'),
  gameShared: () => trackEvent('game_shared', 'social'),
}
