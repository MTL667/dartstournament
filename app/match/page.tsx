'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Tournament {
  id: string;
  name: string;
  startScore: number;
}

interface Match {
  id: string;
  tournament: Tournament;
  player1: Player;
  player2: Player;
  player1Sets: number;
  player2Sets: number;
  currentPlayer: string;
  status: string;
  sets: Set[];
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
  currentPlayer: string;
  status: string;
}

export default function MatchPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [currentLeg, setCurrentLeg] = useState<Leg | null>(null);
  const [turnScore, setTurnScore] = useState<string>('');  // Changed to single turn score input
  const [error, setError] = useState('');

  useEffect(() => {
    if (isUnlocked) {
      fetchMatches();
      const interval = setInterval(fetchMatches, 3000);
      return () => clearInterval(interval);
    }
  }, [isUnlocked]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      if (res.ok) {
        setIsUnlocked(true);
        setError('');
      } else {
        setError('Verkeerde passcode');
      }
    } catch (error) {
      setError('Er is iets misgegaan');
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/tournaments');
      const tournaments = await res.json();
      
      const allMatches: Match[] = [];
      tournaments.forEach((tournament: any) => {
        if (tournament.matches && Array.isArray(tournament.matches)) {
          tournament.matches
            .filter((m: Match) => m.status === 'active' || m.status === 'pending')
            .forEach((m: Match) => allMatches.push(m));
        }
      });
      
      setMatches(allMatches);

      // Update selected match if needed
      if (selectedMatch) {
        const updated = allMatches.find(m => m.id === selectedMatch.id);
        if (updated) {
          setSelectedMatch(updated);
          if (updated.sets && Array.isArray(updated.sets)) {
            const activeSet = updated.sets.find(s => s.status === 'active');
            const activeLeg = activeSet?.legs?.find(l => l.status === 'active');
            setCurrentLeg(activeLeg || null);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    }
  };

  const selectMatch = async (match: Match) => {
    // Fetch full match details
    const res = await fetch(`/api/matches/${match.id}`);
    const fullMatch = await res.json();
    setSelectedMatch(fullMatch);
    
    if (fullMatch.sets && Array.isArray(fullMatch.sets)) {
      const activeSet = fullMatch.sets.find((s: Set) => s.status === 'active');
      const activeLeg = activeSet?.legs?.find((l: Leg) => l.status === 'active');
      setCurrentLeg(activeLeg || null);
    }
    setTurnScore('');
  };

  const submitTurn = async () => {
    if (!selectedMatch || !currentLeg || !turnScore) return;

    const score = parseInt(turnScore);
    if (isNaN(score) || score < 0 || score > 180) {
      alert('Voer een geldige score in (0-180)');
      return;
    }

    const playerId = currentLeg.currentPlayer;

    try {
      const res = await fetch(`/api/matches/${selectedMatch.id}/throw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          score: score,
          dart1: null,  // Not tracking individual darts
          dart2: null,
          dart3: null,
        }),
      });

      const result = await res.json();

      if (result.bust) {
        alert('BUST! Score blijft hetzelfde.');
      } else if (result.matchWon) {
        alert('🏆 MATCH GEWONNEN! 🏆');
        setSelectedMatch(null);
      } else if (result.legWon) {
        alert('✅ LEG GEWONNEN!');
      }

      // Clear input and refresh
      setTurnScore('');
      await fetchMatches();
    } catch (error) {
      console.error('Error submitting turn:', error);
      alert('Fout bij opslaan van beurt');
    }
  };

  const quickScore = (score: number) => {
    setTurnScore(score.toString());
  };

  // Passcode screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Match Invoer</h1>
            <p className="text-gray-600">Voer de passcode in om door te gaan</p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Passcode"
                className="w-full px-6 py-4 text-2xl text-center border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-500 focus:border-transparent text-gray-900"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-red-600 text-center font-semibold">{error}</div>
            )}

            <button
              type="submit"
              className="w-full btn-glass-info py-4 rounded-xl font-bold text-xl"
            >
              🔓 Ontgrendelen
            </button>
          </form>

          <Link 
            href="/"
            className="block text-center mt-6 text-gray-600 hover:text-gray-800"
          >
            ← Terug naar home
          </Link>
        </div>
      </div>
    );
  }

  // Match selection screen
  if (!selectedMatch) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Selecteer Match</h1>
            <button
              onClick={() => setIsUnlocked(false)}
              className="btn-glass-danger px-6 py-2 rounded-xl"
            >
              🔒 Vergrendel
            </button>
          </div>

          {matches.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Geen Actieve Matches</h2>
              <p className="text-gray-600">Start een toernooi in het admin panel</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => selectMatch(match)}
                  className="w-full bg-white hover:bg-gray-50 rounded-lg p-6 shadow-lg transition-all hover:scale-102 text-left"
                  disabled={!match.player1 || !match.player2}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        {match.player1?.name || 'TBD'} vs {match.player2?.name || 'TBD'}
                      </div>
                      <div className="text-gray-600">{match.tournament?.name || 'Tournament'}</div>
                    </div>
                    <div className="text-4xl font-bold text-gray-900">
                      {match.player1Sets} - {match.player2Sets}
                    </div>
                  </div>
                  {(!match.player1 || !match.player2) && (
                    <div className="text-sm text-gray-500 mt-2">Wacht op spelers...</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Score entry screen
  const isPlayer1Turn = currentLeg?.currentPlayer === selectedMatch?.player1?.id;
  const currentPlayer = isPlayer1Turn ? selectedMatch?.player1 : selectedMatch?.player2;
  const currentPlayerScore = isPlayer1Turn ? currentLeg?.player1Score : currentLeg?.player2Score;

  const activeSet = selectedMatch?.sets?.find(s => s.status === 'active');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setSelectedMatch(null)}
            className="btn-glass-neutral px-6 py-3 rounded-xl font-semibold"
          >
            ← Matches
          </button>
          <h1 className="text-2xl font-bold">{selectedMatch?.tournament?.name || 'Match'}</h1>
          <button
            onClick={() => setIsUnlocked(false)}
            className="btn-glass-danger px-6 py-3 rounded-xl font-semibold"
          >
            🔒
          </button>
        </div>

        {/* Scoreboard */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div className={`text-center p-6 rounded-xl ${
              isPlayer1Turn ? 'bg-green-600' : 'bg-gray-700'
            }`}>
              <div className="text-3xl font-bold mb-2">{selectedMatch?.player1?.name || 'TBD'}</div>
              <div className="text-7xl font-bold mb-4">{currentLeg?.player1Score || 0}</div>
              <div className="text-2xl">Legs: {activeSet?.player1Legs || 0}</div>
            </div>

            <div className={`text-center p-6 rounded-xl ${
              !isPlayer1Turn ? 'bg-green-600' : 'bg-gray-700'
            }`}>
              <div className="text-3xl font-bold mb-2">{selectedMatch?.player2?.name || 'TBD'}</div>
              <div className="text-7xl font-bold mb-4">{currentLeg?.player2Score || 0}</div>
              <div className="text-2xl">Legs: {activeSet?.player2Legs || 0}</div>
            </div>
          </div>

          <div className="text-center mt-6 text-xl text-gray-400">
            {currentLeg && `Leg ${currentLeg.legNumber}`}
          </div>
        </div>

        {/* Current Turn Input */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-6">
          <div className="text-center mb-6">
            <div className="text-3xl font-bold mb-2">🎯 {currentPlayer?.name}</div>
            <div className="text-6xl font-bold text-white mb-4">
              {currentPlayerScore}
            </div>
            <div className="text-xl text-gray-400">
              Te gooien
            </div>
          </div>

          {/* Score Input */}
          <div className="max-w-md mx-auto mb-6">
            <label className="block text-xl font-semibold text-gray-300 mb-3 text-center">
              Score deze beurt (0-180)
            </label>
            <input
              type="number"
              value={turnScore}
              onChange={(e) => setTurnScore(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && turnScore) {
                  submitTurn();
                }
              }}
              placeholder="Bijv. 60"
              className="w-full text-6xl font-bold text-center py-6 px-4 bg-gray-900 border-4 border-green-500 rounded-2xl text-white focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-500/50"
              min="0"
              max="180"
              autoFocus
            />
            
            {turnScore && !isNaN(parseInt(turnScore)) && (
              <div className="mt-4 text-center">
                <div className="text-4xl font-bold text-orange-400">
                  Resterend: {currentPlayerScore - parseInt(turnScore)}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setTurnScore('')}
              className="flex-1 btn-glass-danger py-6 rounded-xl font-bold text-2xl"
            >
              ❌ Wissen
            </button>
            <button
              onClick={submitTurn}
              disabled={!turnScore || parseInt(turnScore) < 0 || parseInt(turnScore) > 180}
              className="flex-1 btn-glass-primary py-6 rounded-xl font-bold text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✅ Bevestig Beurt
            </button>
          </div>

          {/* Quick Score Buttons */}
          <div className="text-center text-lg text-gray-400 mb-3">Snelkeuze scores:</div>
          <div className="grid grid-cols-6 gap-2">
            {[26, 41, 45, 60, 81, 85, 100, 121, 140, 180].map((score) => (
              <button
                key={score}
                onClick={() => quickScore(score)}
                className="btn-glass-info py-4 rounded-xl font-bold text-xl hover:scale-105 transition-all"
              >
                {score}
              </button>
            ))}
            <button
              onClick={() => quickScore(0)}
              className="btn-glass-neutral py-4 rounded-xl font-bold text-xl col-span-3"
            >
              Miss (0)
            </button>
            <button
              onClick={() => quickScore(0)}
              className="btn-glass-warning py-4 rounded-xl font-bold text-xl col-span-3"
            >
              Bust (0)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

