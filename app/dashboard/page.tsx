'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BracketView } from '@/components/BracketView';

interface Tournament {
  id: string;
  name: string;
  type: string;
  format: string;
  sets: number;
  legs: number;
  startScore: number;
  status: string;
  matches: Match[];
}

interface Match {
  id: string;
  bracket: string;
  round: number;
  position: number;
  player1: Player | null;
  player2: Player | null;
  player1Sets: number;
  player2Sets: number;
  status: string;
  winnerId?: string | null;
  sets: Set[];
  tournament?: Tournament;
}

interface Player {
  id: string;
  name: string;
}

interface Set {
  id: string;
  setNumber: number;
  player1Legs: number;
  player2Legs: number;
  status: string;
  legs: Leg[];
}

interface Leg {
  id: string;
  legNumber: number;
  player1Score: number;
  player2Score: number;
  status: string;
  currentPlayer: string;
}

export default function DashboardPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);

  useEffect(() => {
    fetchTournaments();
    const interval = setInterval(fetchTournaments, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await fetch('/api/tournaments');
      const data = await res.json();
      
      // Filter active tournaments
      const active = data.filter((t: Tournament) => t.status === 'active');
      setTournaments(active);

      // Get active matches from all tournaments
      const matches: Match[] = [];
      active.forEach((tournament: Tournament) => {
        if (tournament.matches && Array.isArray(tournament.matches)) {
          tournament.matches
            .filter((m: Match) => m.status === 'active')
            .forEach((m: Match) => matches.push(m));
        }
      });
      setActiveMatches(matches);

      // Auto-select first active tournament
      if (active.length > 0 && !selectedTournament) {
        setSelectedTournament(active[0]);
      }
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
    }
  };

  const getCurrentLeg = (match: Match): Leg | null => {
    if (!match.sets || !Array.isArray(match.sets)) return null;
    const activeSet = match.sets.find(s => s.status === 'active');
    if (!activeSet || !activeSet.legs || !Array.isArray(activeSet.legs)) return null;
    const activeLeg = activeSet.legs.find(l => l.status === 'active');
    return activeLeg || null;
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-green-600 shadow-lg flex-shrink-0">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <h1 className="text-4xl font-bold">🎯 Live Darts Dashboard</h1>
          <Link 
            href="/"
            className="btn-glass-neutral px-6 py-2 rounded-xl font-semibold"
          >
            ← Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">
        {tournaments.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-3xl font-bold mb-4">Geen Actieve Toernooien</h2>
            <p className="text-gray-400 mb-8">Start een toernooi in het admin panel</p>
            <Link 
              href="/admin"
              className="btn-glass-primary px-8 py-3 rounded-xl font-semibold inline-block"
            >
              Ga naar Admin
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Tournament Selector */}
            {tournaments.length > 1 && (
              <div className="flex gap-4 flex-wrap">
                {tournaments.map((tournament) => (
                  <button
                    key={tournament.id}
                    onClick={() => setSelectedTournament(tournament)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      selectedTournament?.id === tournament.id
                        ? 'btn-glass-primary'
                        : 'btn-glass-neutral'
                    }`}
                  >
                    {tournament.name}
                  </button>
                ))}
              </div>
            )}

            {/* Active Matches */}
            {activeMatches.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <div className="text-5xl mb-4">⏸️</div>
                <h3 className="text-2xl font-bold mb-2">Geen Actieve Matches</h3>
                <p className="text-gray-400">Matches verschijnen hier zodra ze starten</p>
              </div>
            ) : (
              <div className="grid gap-8">
                {activeMatches.map((match) => {
                  const currentLeg = getCurrentLeg(match);
                  const activeSet = match.sets && Array.isArray(match.sets) ? match.sets.find(s => s.status === 'active') : null;

                  return (
                    <div key={match.id} className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                      {/* Match Header */}
                      <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-2xl font-bold">LIVE MATCH</h3>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="font-semibold">IN PROGRESS</span>
                          </div>
                        </div>
                      </div>

                      {/* Scoreboard */}
                      <div className="p-8">
                        <div className="grid grid-cols-3 gap-8 items-center">
                          {/* Player 1 */}
                          <div className={`text-center p-6 rounded-xl transition-all ${
                            currentLeg && currentLeg.currentPlayer === match.player1?.id 
                              ? 'bg-green-600 scale-105 shadow-xl' 
                              : 'bg-gray-700'
                          }`}>
                            <div className="text-3xl font-bold mb-2">{match.player1?.name || 'TBD'}</div>
                            <div className="text-7xl font-bold mb-4">{currentLeg?.player1Score || 0}</div>
                            {activeSet && (
                              <div className="text-2xl">Legs: {activeSet.player1Legs}</div>
                            )}
                          </div>

                          {/* VS */}
                          <div className="text-center">
                            <div className="text-6xl font-bold text-gray-600">VS</div>
                            {currentLeg && (
                              <div className="mt-4 text-2xl text-gray-400">
                                Leg {currentLeg.legNumber}
                              </div>
                            )}
                          </div>

                          {/* Player 2 */}
                          <div className={`text-center p-6 rounded-xl transition-all ${
                            currentLeg && currentLeg.currentPlayer === match.player2?.id 
                              ? 'bg-green-600 scale-105 shadow-xl' 
                              : 'bg-gray-700'
                          }`}>
                            <div className="text-3xl font-bold mb-2">{match.player2?.name || 'TBD'}</div>
                            <div className="text-7xl font-bold mb-4">{currentLeg?.player2Score || 0}</div>
                            {activeSet && (
                              <div className="text-2xl">Legs: {activeSet.player2Legs}</div>
                            )}
                          </div>
                        </div>

                        {/* Match Format Info */}
                        {match.tournament && (
                          <div className="mt-8 pt-8 border-t border-gray-700 text-center">
                            <div className="text-xl text-gray-400">
                              {match.tournament.format} • First to {match.tournament.legs} legs
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tournament Bracket */}
            {selectedTournament && selectedTournament.type === 'double-elimination' && selectedTournament.matches && selectedTournament.matches.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-2xl font-bold mb-6">{selectedTournament.name} - Tournament Bracket</h3>
                <BracketView 
                  matches={selectedTournament.matches} 
                  sets={selectedTournament.sets}
                />
              </div>
            )}

            {/* All Matches (for non-bracket tournaments or summary) */}
            {selectedTournament && selectedTournament.matches && selectedTournament.matches.length > 0 && selectedTournament.type !== 'double-elimination' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-2xl font-bold mb-4">{selectedTournament.name} - Alle Matches</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {selectedTournament.matches.map((match) => (
                    <div key={match.id} className={`p-4 rounded-lg ${
                      match.status === 'active' ? 'bg-green-900' :
                      match.status === 'completed' ? 'bg-gray-700' :
                      'bg-gray-750'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold">{match.player1?.name || 'TBD'}</div>
                          <div className="text-sm text-gray-400">vs</div>
                          <div className="font-semibold">{match.player2?.name || 'TBD'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold">
                            {match.player1Sets} - {match.player2Sets}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {match.status === 'active' ? '🟢 Live' :
                             match.status === 'completed' ? '✅ Voltooid' :
                             '⏸️ Wachtend'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

