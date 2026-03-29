// Opening detection library for Chess Lobby

export interface Opening {
  name: string
  eco: string
  moves: string
  variation?: string
}

export const OPENINGS: Opening[] = [
  { eco: 'A00', name: 'Uncommon Opening', moves: '' },
  { eco: 'B20', name: 'Sicilian Defense', moves: 'e2e4 c7c5' },
  { eco: 'B21', name: 'Sicilian Defense: Smith-Morra Gambit', moves: 'e2e4 c7c5 d2d4' },
  { eco: 'B22', name: 'Sicilian Defense: Alapin Variation', moves: 'e2e4 c7c5 c2c3' },
  { eco: 'B30', name: 'Sicilian Defense: Old Sicilian', moves: 'e2e4 c7c5 g1f3 b8c6' },
  { eco: 'B40', name: 'Sicilian Defense: French Variation', moves: 'e2e4 c7c5 g1f3 e7e6' },
  { eco: 'B90', name: 'Sicilian Defense: Najdorf Variation', moves: 'e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 a7a6' },
  { eco: 'C00', name: 'French Defense', moves: 'e2e4 e7e6' },
  { eco: 'C01', name: 'French Defense: Exchange Variation', moves: 'e2e4 e7e6 d2d4 d7d5 e4d5' },
  { eco: 'C10', name: 'French Defense: Rubinstein Variation', moves: 'e2e4 e7e6 d2d4 d7d5 b1c3 d5e4' },
  { eco: 'C20', name: "King's Pawn Game", moves: 'e2e4 e7e5' },
  { eco: 'C23', name: "Bishop's Opening", moves: 'e2e4 e7e5 f1c4' },
  { eco: 'C25', name: 'Vienna Game', moves: 'e2e4 e7e5 b1c3' },
  { eco: 'C30', name: "King's Gambit", moves: 'e2e4 e7e5 f2f4' },
  { eco: 'C40', name: "King's Knight Opening", moves: 'e2e4 e7e5 g1f3' },
  { eco: 'C41', name: 'Philidor Defense', moves: 'e2e4 e7e5 g1f3 d7d6' },
  { eco: 'C42', name: 'Russian Game (Petrov Defense)', moves: 'e2e4 e7e5 g1f3 g8f6' },
  { eco: 'C44', name: 'Scotch Game', moves: 'e2e4 e7e5 g1f3 b8c6 d2d4' },
  { eco: 'C46', name: 'Three Knights Game', moves: 'e2e4 e7e5 g1f3 b8c6 b1c3' },
  { eco: 'C47', name: 'Four Knights Game', moves: 'e2e4 e7e5 g1f3 b8c6 b1c3 g8f6' },
  { eco: 'C50', name: 'Italian Game', moves: 'e2e4 e7e5 g1f3 b8c6 f1c4' },
  { eco: 'C51', name: 'Evans Gambit', moves: 'e2e4 e7e5 g1f3 b8c6 f1c4 f8c5 b2b4' },
  { eco: 'C54', name: 'Italian Game: Giuoco Piano', moves: 'e2e4 e7e5 g1f3 b8c6 f1c4 f8c5 c2c3' },
  { eco: 'C55', name: 'Italian Game: Two Knights Defense', moves: 'e2e4 e7e5 g1f3 b8c6 f1c4 g8f6' },
  { eco: 'C60', name: 'Spanish Game (Ruy Lopez)', moves: 'e2e4 e7e5 g1f3 b8c6 f1b5' },
  { eco: 'C62', name: 'Ruy Lopez: Steinitz Defense', moves: 'e2e4 e7e5 g1f3 b8c6 f1b5 d7d6' },
  { eco: 'C65', name: 'Ruy Lopez: Berlin Defense', moves: 'e2e4 e7e5 g1f3 b8c6 f1b5 g8f6' },
  { eco: 'C70', name: 'Ruy Lopez: Morphy Defense', moves: 'e2e4 e7e5 g1f3 b8c6 f1b5 a7a6' },
  { eco: 'C80', name: 'Ruy Lopez: Open Variation', moves: 'e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 f1a4 g8f6 e1g1 f6e4' },
  { eco: 'C90', name: 'Ruy Lopez: Closed Variation', moves: 'e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 f1a4 g8f6 e1g1 f8e7' },
  { eco: 'D00', name: "Queen's Pawn Game", moves: 'd2d4 d7d5' },
  { eco: 'D02', name: "Queen's Pawn: London System", moves: 'd2d4 d7d5 g1f3 g8f6 c1f4' },
  { eco: 'D06', name: "Queen's Gambit", moves: 'd2d4 d7d5 c2c4' },
  { eco: 'D10', name: "Queen's Gambit: Slav Defense", moves: 'd2d4 d7d5 c2c4 c7c6' },
  { eco: 'D20', name: "Queen's Gambit Accepted", moves: 'd2d4 d7d5 c2c4 d5c4' },
  { eco: 'D30', name: "Queen's Gambit Declined", moves: 'd2d4 d7d5 c2c4 e7e6' },
  { eco: 'D43', name: 'Semi-Slav Defense', moves: 'd2d4 d7d5 c2c4 e7e6 b1c3 g8f6 g1f3 c7c6' },
  { eco: 'D50', name: "Queen's Gambit Declined: Modern Variation", moves: 'd2d4 d7d5 c2c4 e7e6 b1c3 g8f6 c1g5' },
  { eco: 'D80', name: 'Grünfeld Defense', moves: 'd2d4 g8f6 c2c4 g7g6 b1c3 d7d5' },
  { eco: 'E00', name: 'Catalan Opening', moves: 'd2d4 g8f6 c2c4 e7e6 g2g3' },
  { eco: 'E10', name: "Queen's Indian Defense", moves: 'd2d4 g8f6 c2c4 e7e6 g1f3 b7b6' },
  { eco: 'E20', name: 'Nimzo-Indian Defense', moves: 'd2d4 g8f6 c2c4 e7e6 b1c3 f8b4' },
  { eco: 'E60', name: "King's Indian Defense", moves: 'd2d4 g8f6 c2c4 g7g6' },
  { eco: 'E70', name: "King's Indian: Averbakh Variation", moves: 'd2d4 g8f6 c2c4 g7g6 b1c3 f8g7 e2e4 d7d6 c1g5' },
  { eco: 'E80', name: "King's Indian: Sämisch Variation", moves: 'd2d4 g8f6 c2c4 g7g6 b1c3 f8g7 e2e4 d7d6 f2f3' },
  { eco: 'E90', name: "King's Indian: Classical Variation", moves: 'd2d4 g8f6 c2c4 g7g6 b1c3 f8g7 e2e4 d7d6 g1f3' },
  { eco: 'A04', name: 'Reti Opening', moves: 'g1f3 d7d5' },
  { eco: 'A10', name: 'English Opening', moves: 'c2c4' },
  { eco: 'A20', name: "English Opening: King's English", moves: 'c2c4 e7e5' },
  { eco: 'A30', name: 'English Opening: Symmetrical Variation', moves: 'c2c4 c7c5' },
  { eco: 'A45', name: 'Indian Defense', moves: 'd2d4 g8f6' },
  { eco: 'A50', name: "Queen's Indian Accelerated", moves: 'd2d4 g8f6 c2c4 b7b6' },
  { eco: 'B00', name: "King's Pawn Opening", moves: 'e2e4' },
  { eco: 'B01', name: 'Scandinavian Defense', moves: 'e2e4 d7d5' },
  { eco: 'B02', name: 'Alekhine Defense', moves: 'e2e4 g8f6' },
  { eco: 'B06', name: 'Modern Defense', moves: 'e2e4 g7g6' },
  { eco: 'B07', name: 'Pirc Defense', moves: 'e2e4 d7d6 d2d4 g8f6' },
  { eco: 'B10', name: 'Caro-Kann Defense', moves: 'e2e4 c7c6' },
  { eco: 'B12', name: 'Caro-Kann: Advance Variation', moves: 'e2e4 c7c6 d2d4 d7d5 e4e5' },
  { eco: 'B13', name: 'Caro-Kann: Exchange Variation', moves: 'e2e4 c7c6 d2d4 d7d5 e4d5' },
  { eco: 'B17', name: 'Caro-Kann: Steinitz Variation', moves: 'e2e4 c7c6 d2d4 d7d5 b1c3 d5e4 c3e4 g8d7' },
]

/**
 * Detect opening from SAN move array (e.g. ['e4', 'c5', 'Nf3', 'Nc6'])
 * Returns a human-readable opening name string.
 */
export function detectOpeningFromMoves(sanMoves: string[]): string {
  const moveStr = sanMoves.slice(0, 10).join(' ').toLowerCase()
    .replace(/[+#!?]/g, '') // strip annotations
    .replace(/x/g, '')       // strip captures marker

  // Sicilian
  if (moveStr.startsWith('e4 c5')) {
    if (moveStr.includes('nf3') && moveStr.includes('d6') && moveStr.includes('d4') && moveStr.includes('nf6') && moveStr.includes('nc3') && moveStr.includes('a6'))
      return 'Sicilian Defense: Najdorf Variation'
    if (moveStr.includes('nf3') && moveStr.includes('nc6') && moveStr.includes('d4') && moveStr.includes('nf6') && moveStr.includes('nc3'))
      return 'Sicilian Defense: Open Sicilian'
    if (moveStr.includes('nf3') && moveStr.includes('nc6')) return 'Sicilian Defense: Old Sicilian'
    if (moveStr.includes('c3')) return 'Sicilian Defense: Alapin Variation'
    if (moveStr.includes('d4')) return 'Sicilian Defense: Open Variation'
    return 'Sicilian Defense'
  }
  // French
  if (moveStr.startsWith('e4 e6')) {
    if (moveStr.includes('d4') && moveStr.includes('d5') && moveStr.includes('nc3') && moveStr.includes('de4')) return 'French Defense: Rubinstein Variation'
    if (moveStr.includes('d4') && moveStr.includes('d5') && moveStr.includes('ed5')) return 'French Defense: Exchange Variation'
    return 'French Defense'
  }
  // 1.e4 e5
  if (moveStr.startsWith('e4 e5')) {
    if (moveStr.includes('nf3') && moveStr.includes('nc6') && moveStr.includes('bb5') && moveStr.includes('a6') && moveStr.includes('ba4') && moveStr.includes('nf6') && moveStr.includes('o-o') && moveStr.includes('be7'))
      return 'Ruy Lopez: Closed Variation'
    if (moveStr.includes('nf3') && moveStr.includes('nc6') && moveStr.includes('bb5') && moveStr.includes('a6') && moveStr.includes('ba4') && moveStr.includes('nf6') && moveStr.includes('o-o') && moveStr.includes('ne4'))
      return 'Ruy Lopez: Open Variation'
    if (moveStr.includes('nf3') && moveStr.includes('nc6') && moveStr.includes('bb5') && moveStr.includes('a6'))
      return 'Ruy Lopez: Morphy Defense'
    if (moveStr.includes('nf3') && moveStr.includes('nc6') && moveStr.includes('bb5') && moveStr.includes('nf6'))
      return 'Ruy Lopez: Berlin Defense'
    if (moveStr.includes('nf3') && moveStr.includes('nc6') && moveStr.includes('bb5') && moveStr.includes('d6'))
      return 'Ruy Lopez: Steinitz Defense'
    if (moveStr.includes('nf3') && moveStr.includes('nc6') && moveStr.includes('bb5'))
      return 'Spanish Game (Ruy Lopez)'
    if (moveStr.includes('nf3') && moveStr.includes('nc6') && moveStr.includes('bc4') && moveStr.includes('bc5') && moveStr.includes('b4'))
      return 'Evans Gambit'
    if (moveStr.includes('nf3') && moveStr.includes('nc6') && moveStr.includes('bc4') && moveStr.includes('bc5') && moveStr.includes('c3'))
      return 'Italian Game: Giuoco Piano'
    if (moveStr.includes('nf3') && moveStr.includes('nc6') && moveStr.includes('bc4') && moveStr.includes('nf6'))
      return 'Italian Game: Two Knights Defense'
    if (moveStr.includes('nf3') && moveStr.includes('nc6') && moveStr.includes('bc4'))
      return 'Italian Game'
    if (moveStr.includes('nf3') && moveStr.includes('nc6') && moveStr.includes('d4'))
      return 'Scotch Game'
    if (moveStr.includes('nf3') && moveStr.includes('nc6') && moveStr.includes('nc3') && moveStr.includes('nf6'))
      return 'Four Knights Game'
    if (moveStr.includes('nf3') && moveStr.includes('nc6') && moveStr.includes('nc3'))
      return 'Three Knights Game'
    if (moveStr.includes('nf3') && moveStr.includes('nf6')) return 'Russian Game (Petrov Defense)'
    if (moveStr.includes('nf3') && moveStr.includes('d6')) return 'Philidor Defense'
    if (moveStr.includes('f4')) return "King's Gambit"
    if (moveStr.includes('nc3') && moveStr.includes('nf3')) return 'Four Knights Game'
    if (moveStr.includes('nc3')) return 'Vienna Game'
    if (moveStr.includes('bc4')) return "Bishop's Opening"
    if (moveStr.includes('nf3')) return "King's Knight Opening"
    return "King's Pawn Game"
  }
  // Caro-Kann
  if (moveStr.startsWith('e4 c6')) {
    if (moveStr.includes('d4') && moveStr.includes('d5') && moveStr.includes('e5')) return 'Caro-Kann: Advance Variation'
    if (moveStr.includes('d4') && moveStr.includes('d5') && moveStr.includes('ed5')) return 'Caro-Kann: Exchange Variation'
    if (moveStr.includes('d4') && moveStr.includes('d5') && moveStr.includes('nc3') && moveStr.includes('de4') && moveStr.includes('nd7'))
      return 'Caro-Kann: Steinitz Variation'
    return 'Caro-Kann Defense'
  }
  if (moveStr.startsWith('e4 d5')) return 'Scandinavian Defense'
  if (moveStr.startsWith('e4 nf6')) return 'Alekhine Defense'
  if (moveStr.startsWith('e4 g6')) return 'Modern Defense'
  if (moveStr.startsWith('e4 d6')) {
    if (moveStr.includes('d4') && moveStr.includes('nf6')) return 'Pirc Defense'
    return 'Pirc Defense'
  }
  // d4 openings
  if (moveStr.startsWith('d4 d5 c4 c6')) {
    if (moveStr.includes('nc3') && moveStr.includes('nf6') && moveStr.includes('nf3') && moveStr.includes('e6'))
      return 'Semi-Slav Defense'
    return 'Slav Defense'
  }
  if (moveStr.startsWith('d4 d5 c4 e6')) {
    if (moveStr.includes('nc3') && moveStr.includes('nf6') && moveStr.includes('bg5')) return "Queen's Gambit Declined: Modern Variation"
    if (moveStr.includes('nc3') && moveStr.includes('nf6') && moveStr.includes('bf4')) return "Queen's Gambit Declined: Classical Variation"
    return "Queen's Gambit Declined"
  }
  if (moveStr.startsWith('d4 d5 c4') && (moveStr.includes('dc4') || moveStr.includes('dxc4'))) return "Queen's Gambit Accepted"
  if (moveStr.startsWith('d4 d5 c4')) return "Queen's Gambit"
  if (moveStr.startsWith('d4 d5') && moveStr.includes('nf3') && moveStr.includes('nf6') && moveStr.includes('bf4')) return "Queen's Pawn: London System"
  if (moveStr.startsWith('d4 d5')) return "Queen's Pawn Game"
  // Indian systems
  if (moveStr.startsWith('d4 nf6 c4 g6 nc3 d5')) return 'Grünfeld Defense'
  if (moveStr.startsWith('d4 nf6 c4 g6 nc3') && moveStr.includes('bg7') && moveStr.includes('e4') && moveStr.includes('d6') && moveStr.includes('bg5'))
    return "King's Indian: Averbakh Variation"
  if (moveStr.startsWith('d4 nf6 c4 g6 nc3') && moveStr.includes('bg7') && moveStr.includes('e4') && moveStr.includes('d6') && moveStr.includes('f3'))
    return "King's Indian: Sämisch Variation"
  if (moveStr.startsWith('d4 nf6 c4 g6 nc3') && moveStr.includes('bg7') && moveStr.includes('e4') && moveStr.includes('d6') && moveStr.includes('nf3'))
    return "King's Indian: Classical Variation"
  if (moveStr.startsWith('d4 nf6 c4 g6')) return "King's Indian Defense"
  if (moveStr.startsWith('d4 nf6 c4 e6 nc3 bb4')) return 'Nimzo-Indian Defense'
  if (moveStr.startsWith('d4 nf6 c4 e6 nf3 b6')) return "Queen's Indian Defense"
  if (moveStr.startsWith('d4 nf6 c4 e6') && moveStr.includes('g3')) return 'Catalan Opening'
  if (moveStr.startsWith('d4 nf6 c4 b6')) return "Queen's Indian Accelerated"
  if (moveStr.startsWith('d4 nf6')) return 'Indian Defense'
  if (moveStr.startsWith('nf3 d5')) return 'Reti Opening'
  if (moveStr.startsWith('c4 e5')) return "English Opening: King's English"
  if (moveStr.startsWith('c4 c5')) return 'English Opening: Symmetrical Variation'
  if (moveStr.startsWith('c4')) return 'English Opening'
  if (moveStr.startsWith('e4')) return "King's Pawn Opening"
  if (moveStr.startsWith('d4')) return "Queen's Pawn Game"
  return 'Opening'
}
