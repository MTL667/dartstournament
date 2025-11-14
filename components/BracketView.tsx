'use client';

import { getMatchName } from '@/lib/bracket';

interface Player {
  id: string;
  name: string;
}

interface Match {
  id: string;
  bracket: string;
  round: number;
  position: number;
  player1?: Player | null;
  player2?: Player | null;
  player1Sets: number;
  player2Sets: number;
  status: string;
  winnerId?: string | null;
}

interface BracketViewProps {
  matches: Match[];
  sets: number;
}

export function BracketView({ matches, sets }: BracketViewProps) {
  const winnersBracket = matches.filter(m => m.bracket === 'winners');
  const losersBracket = matches.filter(m => m.bracket === 'losers');
  
  // Group by rounds
  const winnersRounds = groupByRound(winnersBracket);
  const losersRounds = groupByRound(losersBracket);

  return (
    <div className="space-y-12">
      {/* Winners Bracket */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-6">🏆 Winners Bracket</h2>
        <div className="flex gap-8 overflow-x-auto pb-4">
          {Object.entries(winnersRounds).map(([round, roundMatches]) => (
            <div key={round} className="flex flex-col gap-4 min-w-[300px]">
              <div className="text-xl font-semibold text-gray-300 mb-2">
                {roundMatches[0].round === 3 ? 'Finals' : `Round ${round}`}
              </div>
              {roundMatches.map(match => (
                <MatchCard key={match.id} match={match} setsToWin={sets} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Losers Bracket */}
      {losersBracket.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold text-orange-400 mb-6">🔄 Losers Bracket</h2>
          <div className="flex gap-8 overflow-x-auto pb-4">
            {Object.entries(losersRounds).map(([round, roundMatches]) => (
              <div key={round} className="flex flex-col gap-4 min-w-[300px]">
                <div className="text-xl font-semibold text-gray-300 mb-2">
                  {roundMatches[0].round === 4 ? 'Finals' : `Round ${round}`}
                </div>
                {roundMatches.map(match => (
                  <MatchCard key={match.id} match={match} setsToWin={sets} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchCard({ match, setsToWin }: { match: Match; setsToWin: number }) {
  const isCompleted = match.status === 'completed';
  const isActive = match.status === 'active';

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border-2 ${
      isActive ? 'border-green-500 shadow-green-500/50 shadow-lg' :
      isCompleted ? 'border-gray-600' :
      'border-gray-700'
    }`}>
      <div className="text-xs text-gray-400 mb-2">
        {getMatchName(match)}
      </div>

      {/* Player 1 */}
      <div className={`flex justify-between items-center p-3 rounded mb-2 ${
        match.winnerId === match.player1?.id ? 'bg-green-900/50 border border-green-500' :
        match.player1 ? 'bg-gray-700' : 'bg-gray-900'
      }`}>
        <div className="font-semibold">
          {match.player1?.name || 'TBD'}
        </div>
        <div className="text-2xl font-bold">
          {match.player1 ? match.player1Sets : '-'}
        </div>
      </div>

      {/* VS */}
      <div className="text-center text-xs text-gray-500 mb-2">
        {isActive ? '🔴 LIVE' : isCompleted ? 'Final' : 'vs'}
      </div>

      {/* Player 2 */}
      <div className={`flex justify-between items-center p-3 rounded ${
        match.winnerId === match.player2?.id ? 'bg-green-900/50 border border-green-500' :
        match.player2 ? 'bg-gray-700' : 'bg-gray-900'
      }`}>
        <div className="font-semibold">
          {match.player2?.name || 'TBD'}
        </div>
        <div className="text-2xl font-bold">
          {match.player2 ? match.player2Sets : '-'}
        </div>
      </div>

      {/* Match Info */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        Best of {setsToWin * 2 - 1} Sets
      </div>
    </div>
  );
}

function groupByRound(matches: Match[]): Record<number, Match[]> {
  const grouped: Record<number, Match[]> = {};
  
  matches.forEach(match => {
    if (!grouped[match.round]) {
      grouped[match.round] = [];
    }
    grouped[match.round].push(match);
  });

  // Sort matches within each round by position
  Object.keys(grouped).forEach(round => {
    grouped[parseInt(round)].sort((a, b) => a.position - b.position);
  });

  return grouped;
}

