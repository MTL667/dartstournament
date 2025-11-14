// Double Elimination Bracket Generator for 8 players

export interface BracketMatch {
  bracket: 'winners' | 'losers' | 'grand-final';
  round: number;
  position: number;
  player1Seed?: number;
  player2Seed?: number;
  winnerNextMatchId?: string;
  loserNextMatchId?: string;
  winnerSlot?: 'player1' | 'player2';
  loserSlot?: 'player1' | 'player2';
}

/**
 * Generates a complete double elimination bracket structure for 8 players
 * Based on standard double elimination format
 */
export function generateDoubleEliminationBracket(): BracketMatch[] {
  const matches: BracketMatch[] = [];
  
  // WINNERS BRACKET
  // Round 1 (4 matches)
  const wb_r1_m1: BracketMatch = { bracket: 'winners', round: 1, position: 1, player1Seed: 1, player2Seed: 8 };
  const wb_r1_m2: BracketMatch = { bracket: 'winners', round: 1, position: 2, player1Seed: 4, player2Seed: 5 };
  const wb_r1_m3: BracketMatch = { bracket: 'winners', round: 1, position: 3, player1Seed: 2, player2Seed: 7 };
  const wb_r1_m4: BracketMatch = { bracket: 'winners', round: 1, position: 4, player1Seed: 3, player2Seed: 6 };
  
  // Round 2 (2 matches)
  const wb_r2_m1: BracketMatch = { bracket: 'winners', round: 2, position: 1 };
  const wb_r2_m2: BracketMatch = { bracket: 'winners', round: 2, position: 2 };
  
  // Winners Bracket Final (1 match)
  const wb_final: BracketMatch = { bracket: 'winners', round: 3, position: 1 };
  
  // LOSERS BRACKET
  // Round 1 (2 matches) - Losers from WB R1
  const lb_r1_m1: BracketMatch = { bracket: 'losers', round: 1, position: 1 };
  const lb_r1_m2: BracketMatch = { bracket: 'losers', round: 1, position: 2 };
  
  // Round 2 (2 matches) - Winners from LB R1 vs Losers from WB R2
  const lb_r2_m1: BracketMatch = { bracket: 'losers', round: 2, position: 1 };
  const lb_r2_m2: BracketMatch = { bracket: 'losers', round: 2, position: 2 };
  
  // Round 3 (1 match) - Winners from LB R2
  const lb_r3_m1: BracketMatch = { bracket: 'losers', round: 3, position: 1 };
  
  // Losers Bracket Final (1 match) - Winner LB R3 vs Loser WB Final
  const lb_final: BracketMatch = { bracket: 'losers', round: 4, position: 1 };
  
  // GRAND FINAL
  const grand_final: BracketMatch = { bracket: 'grand-final', round: 1, position: 1 };
  
  // Connect Winners Bracket
  wb_r1_m1.winnerNextMatchId = 'wb_r2_m1';
  wb_r1_m1.winnerSlot = 'player1';
  wb_r1_m1.loserNextMatchId = 'lb_r1_m1';
  wb_r1_m1.loserSlot = 'player1';
  
  wb_r1_m2.winnerNextMatchId = 'wb_r2_m1';
  wb_r1_m2.winnerSlot = 'player2';
  wb_r1_m2.loserNextMatchId = 'lb_r1_m1';
  wb_r1_m2.loserSlot = 'player2';
  
  wb_r1_m3.winnerNextMatchId = 'wb_r2_m2';
  wb_r1_m3.winnerSlot = 'player1';
  wb_r1_m3.loserNextMatchId = 'lb_r1_m2';
  wb_r1_m3.loserSlot = 'player1';
  
  wb_r1_m4.winnerNextMatchId = 'wb_r2_m2';
  wb_r1_m4.winnerSlot = 'player2';
  wb_r1_m4.loserNextMatchId = 'lb_r1_m2';
  wb_r1_m4.loserSlot = 'player2';
  
  wb_r2_m1.winnerNextMatchId = 'wb_final';
  wb_r2_m1.winnerSlot = 'player1';
  wb_r2_m1.loserNextMatchId = 'lb_r2_m1';
  wb_r2_m1.loserSlot = 'player2';
  
  wb_r2_m2.winnerNextMatchId = 'wb_final';
  wb_r2_m2.winnerSlot = 'player2';
  wb_r2_m2.loserNextMatchId = 'lb_r2_m2';
  wb_r2_m2.loserSlot = 'player2';
  
  wb_final.winnerNextMatchId = 'grand_final';
  wb_final.winnerSlot = 'player1';
  wb_final.loserNextMatchId = 'lb_final';
  wb_final.loserSlot = 'player2';
  
  // Connect Losers Bracket
  lb_r1_m1.winnerNextMatchId = 'lb_r2_m1';
  lb_r1_m1.winnerSlot = 'player1';
  
  lb_r1_m2.winnerNextMatchId = 'lb_r2_m2';
  lb_r1_m2.winnerSlot = 'player1';
  
  lb_r2_m1.winnerNextMatchId = 'lb_r3_m1';
  lb_r2_m1.winnerSlot = 'player1';
  
  lb_r2_m2.winnerNextMatchId = 'lb_r3_m1';
  lb_r2_m2.winnerSlot = 'player2';
  
  lb_r3_m1.winnerNextMatchId = 'lb_final';
  lb_r3_m1.winnerSlot = 'player1';
  
  lb_final.winnerNextMatchId = 'grand_final';
  lb_final.winnerSlot = 'player2';
  
  // Return all matches in order
  return [
    // Winners Bracket
    { ...wb_r1_m1, id: 'wb_r1_m1' },
    { ...wb_r1_m2, id: 'wb_r1_m2' },
    { ...wb_r1_m3, id: 'wb_r1_m3' },
    { ...wb_r1_m4, id: 'wb_r1_m4' },
    { ...wb_r2_m1, id: 'wb_r2_m1' },
    { ...wb_r2_m2, id: 'wb_r2_m2' },
    { ...wb_final, id: 'wb_final' },
    // Losers Bracket
    { ...lb_r1_m1, id: 'lb_r1_m1' },
    { ...lb_r1_m2, id: 'lb_r1_m2' },
    { ...lb_r2_m1, id: 'lb_r2_m1' },
    { ...lb_r2_m2, id: 'lb_r2_m2' },
    { ...lb_r3_m1, id: 'lb_r3_m1' },
    { ...lb_final, id: 'lb_final' },
    // Grand Final
    { ...grand_final, id: 'grand_final' },
  ] as any;
}

/**
 * Get match display name
 */
export function getMatchName(match: { bracket: string; round: number; position: number }): string {
  if (match.bracket === 'grand-final') {
    return 'Grand Final';
  }
  
  if (match.bracket === 'winners') {
    if (match.round === 3) return 'Winners Final';
    return `Winners R${match.round} M${match.position}`;
  }
  
  if (match.bracket === 'losers') {
    if (match.round === 4) return 'Losers Final';
    return `Losers R${match.round} M${match.position}`;
  }
  
  return `Match ${match.position}`;
}

