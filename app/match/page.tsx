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

interface Throw {
  id: string;
  score: number;
  playerId: string;
  dart1: number | null;
  dart2: number | null;
  dart3: number | null;
}

interface Leg {
  id: string;
  legNumber: number;
  player1Score: number;
  player2Score: number;
  currentPlayer: string;
  status: string;
  throws?: Throw[];
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
    try {
      // Fetch full match details
      const res = await fetch(`/api/matches/${match.id}`);
      const fullMatch = await res.json();
      
      // Check if match has active set/leg, if not initialize with a throw of 0
      if (!fullMatch.sets || fullMatch.sets.length === 0 || 
          !fullMatch.sets.find((s: Set) => s.status === 'active')) {
        // Initialize match by making a "dummy" throw that will create set and leg
        console.log('Initializing match with first set and leg...');
        const initRes = await fetch(`/api/matches/${match.id}/throw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: fullMatch.player1Id,
            score: 0,
            dart1: null,
            dart2: null,
            dart3: null,
          }),
        });
        
        if (initRes.ok) {
          // Re-fetch match with new set/leg
          const updatedRes = await fetch(`/api/matches/${match.id}`);
          const updatedMatch = await updatedRes.json();
          setSelectedMatch(updatedMatch);
          
          if (updatedMatch.sets && Array.isArray(updatedMatch.sets)) {
            const activeSet = updatedMatch.sets.find((s: Set) => s.status === 'active');
            const activeLeg = activeSet?.legs?.find((l: Leg) => l.status === 'active');
            setCurrentLeg(activeLeg || null);
          }
        }
      } else {
        setSelectedMatch(fullMatch);
        
        if (fullMatch.sets && Array.isArray(fullMatch.sets)) {
          const activeSet = fullMatch.sets.find((s: Set) => s.status === 'active');
          const activeLeg = activeSet?.legs?.find((l: Leg) => l.status === 'active');
          setCurrentLeg(activeLeg || null);
        }
      }
      
      setTurnScore('');
    } catch (error) {
      console.error('Error selecting match:', error);
      alert('Fout bij selecteren van match: ' + error);
    }
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

      // Clear input and refresh match data
      setTurnScore('');
      
      // Re-fetch the full match to update currentLeg
      if (selectedMatch) {
        const res = await fetch(`/api/matches/${selectedMatch.id}`);
        const updatedMatch = await res.json();
        setSelectedMatch(updatedMatch);
        
        if (updatedMatch.sets && Array.isArray(updatedMatch.sets)) {
          const activeSet = updatedMatch.sets.find((s: any) => s.status === 'active');
          const activeLeg = activeSet?.legs?.find((l: any) => l.status === 'active');
          setCurrentLeg(activeLeg || null);
        }
      }
      
      await fetchMatches();
    } catch (error) {
      console.error('Error submitting turn:', error);
      alert('Fout bij opslaan van beurt: ' + error);
    }
  };

  const quickScore = (score: number) => {
    setTurnScore(score.toString());
  };

  const undoLastThrow = async () => {
    if (!selectedMatch || !currentLeg) return;
    
    if (!confirm('Weet je zeker dat je de laatste beurt wilt verwijderen?')) return;

    try {
      // Get the last throw
      const throws = currentLeg.throws || [];
      if (throws.length === 0) {
        alert('Geen beurten om te verwijderen');
        return;
      }

      const lastThrow = throws[throws.length - 1];
      
      // Delete the last throw
      const res = await fetch(`/api/throws/${lastThrow.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Refresh match data
        const updatedRes = await fetch(`/api/matches/${selectedMatch.id}`);
        const updatedMatch = await updatedRes.json();
        setSelectedMatch(updatedMatch);
        
        if (updatedMatch.sets && Array.isArray(updatedMatch.sets)) {
          const activeSet = updatedMatch.sets.find((s: any) => s.status === 'active');
          const activeLeg = activeSet?.legs?.find((l: any) => l.status === 'active');
          setCurrentLeg(activeLeg || null);
        }
        
        await fetchMatches();
      } else {
        alert('Fout bij verwijderen van beurt');
      }
    } catch (error) {
      console.error('Error undoing throw:', error);
      alert('Fout bij verwijderen van beurt: ' + error);
    }
  };

  const switchStartingPlayer = async () => {
    if (!selectedMatch) return;
    
    if (!confirm('Wil je de startspeler voor deze match wijzigen?')) return;

    try {
      const newStartingPlayer = selectedMatch.startingPlayer === selectedMatch.player1Id 
        ? selectedMatch.player2Id 
        : selectedMatch.player1Id;

      const res = await fetch(`/api/matches/${selectedMatch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startingPlayer: newStartingPlayer,
          currentPlayer: newStartingPlayer,
        }),
      });

      if (res.ok) {
        // Refresh match data
        const updatedRes = await fetch(`/api/matches/${selectedMatch.id}`);
        const updatedMatch = await updatedRes.json();
        setSelectedMatch(updatedMatch);
        
        if (updatedMatch.sets && Array.isArray(updatedMatch.sets)) {
          const activeSet = updatedMatch.sets.find((s: any) => s.status === 'active');
          const activeLeg = activeSet?.legs?.find((l: any) => l.status === 'active');
          setCurrentLeg(activeLeg || null);
        }
        
        await fetchMatches();
        alert(`Startspeler gewijzigd naar: ${updatedMatch.startingPlayer === updatedMatch.player1Id ? updatedMatch.player1?.name : updatedMatch.player2?.name}`);
      }
    } catch (error) {
      console.error('Error switching starting player:', error);
      alert('Fout bij wijzigen startspeler: ' + error);
    }
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
    <div className="min-h-screen bg-gray-900 text-white p-2 md:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header - Compact */}
        <div className="mb-4 space-y-2">
          <div className="flex justify-between items-center bg-gray-800 rounded-xl p-3">
            <button
              onClick={() => setSelectedMatch(null)}
              className="btn-glass-neutral px-4 py-2 rounded-xl font-semibold text-sm"
            >
              ← Matches
            </button>
            <h1 className="text-lg md:text-xl font-bold truncate px-2">{selectedMatch?.tournament?.name || 'Match'}</h1>
            <button
              onClick={() => setIsUnlocked(false)}
              className="btn-glass-danger px-4 py-2 rounded-xl font-semibold text-sm"
            >
              🔒
            </button>
          </div>
          
          {/* Referee Tools */}
          <div className="flex gap-2">
            <button
              onClick={undoLastThrow}
              className="flex-1 btn-glass-warning py-3 rounded-xl font-semibold text-sm hover:scale-105 transition-all"
            >
              ↶ Laatste beurt ongedaan maken
            </button>
            <button
              onClick={switchStartingPlayer}
              className="flex-1 btn-glass-info py-3 rounded-xl font-semibold text-sm hover:scale-105 transition-all"
            >
              🔄 Wissel startspeler
            </button>
          </div>
        </div>

        {/* Scoreboard - Prominent en iPad-vriendelijk */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-4 mb-4 shadow-2xl border-2 border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            {/* Player 1 */}
            <div className={`text-center p-6 rounded-2xl transition-all duration-300 ${
              isPlayer1Turn 
                ? 'bg-gradient-to-br from-green-600 to-green-700 scale-105 shadow-2xl ring-4 ring-green-400' 
                : 'bg-gray-700'
            }`}>
              <div className="text-2xl md:text-4xl font-bold mb-3 truncate">{selectedMatch?.player1?.name || 'TBD'}</div>
              <div className="text-8xl md:text-9xl font-black mb-4 text-white drop-shadow-lg">
                {currentLeg?.player1Score || 0}
              </div>
              <div className="text-xl md:text-2xl opacity-90">
                Legs gewonnen: <span className="font-bold">{activeSet?.player1Legs || 0}</span>
              </div>
              {isPlayer1Turn && (
                <div className="mt-3 text-lg font-semibold text-green-200 animate-pulse">
                  ▶ AAN DE BEURT
                </div>
              )}
            </div>

            {/* Player 2 */}
            <div className={`text-center p-6 rounded-2xl transition-all duration-300 ${
              !isPlayer1Turn 
                ? 'bg-gradient-to-br from-green-600 to-green-700 scale-105 shadow-2xl ring-4 ring-green-400' 
                : 'bg-gray-700'
            }`}>
              <div className="text-2xl md:text-4xl font-bold mb-3 truncate">{selectedMatch?.player2?.name || 'TBD'}</div>
              <div className="text-8xl md:text-9xl font-black mb-4 text-white drop-shadow-lg">
                {currentLeg?.player2Score || 0}
              </div>
              <div className="text-xl md:text-2xl opacity-90">
                Legs gewonnen: <span className="font-bold">{activeSet?.player2Legs || 0}</span>
              </div>
              {!isPlayer1Turn && (
                <div className="mt-3 text-lg font-semibold text-green-200 animate-pulse">
                  ▶ AAN DE BEURT
                </div>
              )}
            </div>
          </div>

          <div className="text-center mt-4 text-lg md:text-xl text-gray-300 bg-gray-800/50 rounded-xl py-2">
            {currentLeg && `Leg ${currentLeg.legNumber}`} • {currentPlayer?.name || 'TBD'} gooit
          </div>
        </div>

        {/* Score Input - iPad Optimized */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-4 md:p-6 shadow-2xl border-2 border-gray-700">
          {/* Score Input Field */}
          <div className="mb-6">
            <label className="block text-2xl md:text-3xl font-bold text-center mb-4 text-green-400">
              Voer score in voor {currentPlayer?.name}
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={turnScore}
              onChange={(e) => setTurnScore(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && turnScore) {
                  submitTurn();
                }
              }}
              placeholder="0-180"
              className="w-full text-7xl md:text-8xl font-black text-center py-8 px-4 bg-gray-900 border-4 border-green-500 rounded-3xl text-white focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-500/50 shadow-inner"
              min="0"
              max="180"
              autoFocus
            />
            
            {turnScore && !isNaN(parseInt(turnScore)) && currentPlayerScore !== undefined && (
              <div className="mt-6 p-4 bg-orange-500/20 border-2 border-orange-500 rounded-2xl">
                <div className="text-center">
                  <div className="text-xl text-orange-200 mb-1">NA DEZE BEURT:</div>
                  <div className="text-6xl font-black text-orange-400">
                    {Math.max(0, currentPlayerScore - parseInt(turnScore))}
                  </div>
                  <div className="text-lg text-orange-200 mt-1">punten resterend</div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - Extra Groot */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setTurnScore('')}
              className="btn-glass-danger py-8 rounded-2xl font-bold text-3xl shadow-xl hover:scale-105 transition-all"
            >
              <div className="text-5xl mb-2">❌</div>
              <div>Wissen</div>
            </button>
            <button
              onClick={submitTurn}
              disabled={!turnScore || isNaN(parseInt(turnScore)) || parseInt(turnScore) < 0 || parseInt(turnScore) > 180}
              className="btn-glass-primary py-8 rounded-2xl font-bold text-3xl shadow-xl hover:scale-105 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="text-5xl mb-2">✅</div>
              <div>Bevestig</div>
            </button>
          </div>

          {/* Quick Score Buttons - Groot en Touch-vriendelijk */}
          <div className="bg-gray-900/50 rounded-2xl p-4">
            <div className="text-center text-xl font-semibold text-gray-300 mb-4">⚡ Snelkeuze</div>
            <div className="grid grid-cols-5 gap-3">
              {[26, 41, 45, 60, 81, 85, 100, 121, 140, 180].map((score) => (
                <button
                  key={score}
                  onClick={() => quickScore(score)}
                  className="btn-glass-info py-6 rounded-xl font-bold text-2xl hover:scale-110 transition-all active:scale-95"
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                onClick={() => quickScore(0)}
                className="btn-glass-neutral py-6 rounded-xl font-bold text-xl hover:scale-105 transition-all"
              >
                ⭕ Miss (0)
              </button>
              <button
                onClick={() => quickScore(0)}
                className="btn-glass-warning py-6 rounded-xl font-bold text-xl hover:scale-105 transition-all"
              >
                💥 Bust (0)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

