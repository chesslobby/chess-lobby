import { create } from 'zustand'
import type { GameState, Player, ChatMessage } from '@royal-chess/chess-engine'

interface GameStore {
  game: GameState | null
  players: { white: Player | null; black: Player | null }
  myColor: 'w' | 'b' | null
  messages: ChatMessage[]
  isVoiceActive: boolean
  isMuted: boolean
  spectatorCount: number
  setGame: (game: GameState) => void
  setPlayers: (players: { white: Player | null; black: Player | null }) => void
  setMyColor: (color: 'w' | 'b') => void
  addMessage: (msg: ChatMessage) => void
  setVoiceActive: (active: boolean) => void
  setMuted: (muted: boolean) => void
  setSpectatorCount: (count: number) => void
  reset: () => void
}

const initialState = {
  game: null,
  players: { white: null, black: null },
  myColor: null,
  messages: [],
  isVoiceActive: false,
  isMuted: false,
  spectatorCount: 0,
}

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  setGame: (game) => set({ game }),
  setPlayers: (players) => set({ players }),
  setMyColor: (myColor) => set({ myColor }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setVoiceActive: (isVoiceActive) => set({ isVoiceActive }),
  setMuted: (isMuted) => set({ isMuted }),
  setSpectatorCount: (spectatorCount) => set({ spectatorCount }),
  reset: () => set(initialState),
}))
