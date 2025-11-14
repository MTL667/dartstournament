'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Tournament {
  id: string;
  name: string;
  format: string;
  sets: number;
  legs: number;
  startScore: number;
  status: string;
  players: Player[];
  matches: Match[];
}

interface Player {
  id: string;
  name: string;
}

interface Match {
  id: string;
  player1: Player;
  player2: Player;
  status: string;
}

export default function AdminPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'double-elimination',
    format: 'BO5',
    sets: 1,
    legs: 3,
    startScore: 501,
    playersCount: 8,
    playerNames: ['', '', '', '', '', '', '', ''],
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await fetch('/api/tournaments');
      const data = await res.json();
      setTournaments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
      setTournaments([]);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const playerNames = formData.playerNames.filter(name => name.trim() !== '');
    
    if (formData.type === 'double-elimination' && playerNames.length !== 8) {
      alert('Double elimination vereist exact 8 spelers');
      return;
    }
    
    if (playerNames.length < 2) {
      alert('Voeg minimaal 2 spelers toe');
      return;
    }

    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          playerNames,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setShowCreateForm(false);
        setFormData({
          name: '',
          type: 'double-elimination',
          format: 'BO3',
          sets: 2,
          legs: 3,
          startScore: 501,
          playersCount: 8,
          playerNames: ['', '', '', '', '', '', '', ''],
        });
        fetchTournaments();
      } else {
        alert(data.error || 'Failed to create tournament');
      }
    } catch (error) {
      console.error('Failed to create tournament:', error);
      alert('Failed to create tournament');
    }
  };

  const handleStartTournament = async (tournamentId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/start`, {
        method: 'POST',
      });

      if (res.ok) {
        fetchTournaments();
      }
    } catch (error) {
      console.error('Failed to start tournament:', error);
    }
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!confirm('Weet je zeker dat je dit toernooi wilt verwijderen?')) {
      return;
    }

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchTournaments();
      }
    } catch (error) {
      console.error('Failed to delete tournament:', error);
    }
  };

  const addPlayerField = () => {
    setFormData({
      ...formData,
      playerNames: [...formData.playerNames, ''],
    });
  };

  const updatePlayerName = (index: number, name: string) => {
    const newPlayerNames = [...formData.playerNames];
    newPlayerNames[index] = name;
    setFormData({ ...formData, playerNames: newPlayerNames });
  };

  const removePlayerField = (index: number) => {
    const newPlayerNames = formData.playerNames.filter((_, i) => i !== index);
    setFormData({ ...formData, playerNames: newPlayerNames });
  };

  return (
    <div className="min-h-screen h-full bg-gray-50 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">⚙️ Toernooi Beheer</h1>
          <Link 
            href="/"
            className="btn-glass-neutral px-6 py-2 rounded-xl"
          >
            ← Terug
          </Link>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="mb-6 btn-glass-primary px-6 py-3 rounded-xl font-semibold"
        >
          {showCreateForm ? '❌ Annuleer' : '➕ Nieuw Toernooi'}
        </button>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Nieuw Toernooi Maken</h2>
            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Toernooi Naam
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tournament Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    const count = type === 'double-elimination' ? 8 : 2;
                    const names = Array(count).fill('');
                    setFormData({ ...formData, type, playersCount: count, playerNames: names });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="double-elimination">Double Elimination (8 spelers)</option>
                  <option value="single-elimination">Single Elimination</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Format (Best of X Legs)
                  </label>
                  <select
                    value={formData.format}
                    onChange={(e) => {
                      const format = e.target.value;
                      const totalLegs = parseInt(format.replace('BO', ''));
                      const legsToWin = Math.ceil(totalLegs / 2);
                      setFormData({ ...formData, format, legs: legsToWin, sets: 1 });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="BO3">Best of 3 Legs (First to 2)</option>
                    <option value="BO5">Best of 5 Legs (First to 3)</option>
                    <option value="BO7">Best of 7 Legs (First to 4)</option>
                    <option value="BO9">Best of 9 Legs (First to 5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legs om te winnen (First to)
                  </label>
                  <input
                    type="number"
                    value={formData.legs}
                    onChange={(e) => setFormData({ ...formData, legs: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Score
                  </label>
                  <select
                    value={formData.startScore}
                    onChange={(e) => setFormData({ ...formData, startScore: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="301">301</option>
                    <option value="501">501</option>
                    <option value="701">701</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spelers {formData.type === 'double-elimination' && '(Seeding 1-8)'}
                </label>
                <div className="space-y-2">
                  {formData.playerNames.map((name, index) => (
                    <div key={index} className="flex gap-2">
                      {formData.type === 'double-elimination' && (
                        <div className="w-12 flex items-center justify-center bg-gray-200 rounded-lg font-bold">
                          #{index + 1}
                        </div>
                      )}
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => updatePlayerName(index, e.target.value)}
                        placeholder={formData.type === 'double-elimination' ? `Seed ${index + 1}` : `Speler ${index + 1}`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        required={formData.type === 'double-elimination'}
                      />
                      {formData.type !== 'double-elimination' && formData.playerNames.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removePlayerField(index)}
                          className="px-4 py-2 btn-glass-danger rounded-xl"
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {formData.type !== 'double-elimination' && (
                  <button
                    type="button"
                    onClick={addPlayerField}
                    className="mt-2 text-green-600 hover:text-green-700 font-medium"
                  >
                    ➕ Speler Toevoegen
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="w-full btn-glass-primary py-3 rounded-xl font-semibold"
              >
                Toernooi Aanmaken
              </button>
            </form>
          </div>
        )}

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Toernooien</h2>
          
          {tournaments.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              Nog geen toernooien. Maak er een aan!
            </div>
          ) : (
            tournaments.map((tournament) => (
              <div key={tournament.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{tournament.name}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span>📊 {tournament.format}</span>
                      <span>🎯 {tournament.startScore}</span>
                      <span className={`px-3 py-1 rounded-full ${
                        tournament.status === 'active' ? 'bg-green-100 text-green-800' :
                        tournament.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {tournament.status === 'active' ? '🟢 Actief' :
                         tournament.status === 'completed' ? '✅ Voltooid' :
                         '⏸️ Setup'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {tournament.status === 'setup' && (
                      <button
                        onClick={() => handleStartTournament(tournament.id)}
                        className="btn-glass-primary px-4 py-2 rounded-xl"
                      >
                        ▶️ Start
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTournament(tournament.id)}
                      className="btn-glass-danger px-4 py-2 rounded-xl"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Spelers ({tournament.players?.length || 0})
                    </h4>
                    <div className="space-y-1">
                      {tournament.players && tournament.players.length > 0 ? (
                        tournament.players.map((player) => (
                          <div key={player.id} className="text-gray-600">
                            👤 {player.name}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm">Geen spelers</div>
                      )}
                    </div>
                  </div>

                  {tournament.matches && tournament.matches.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">
                        Matches ({tournament.matches.length})
                      </h4>
                      <div className="space-y-2">
                        {tournament.matches.map((match) => (
                          <div key={match.id} className="bg-gray-50 p-3 rounded">
                            <div className="text-sm">
                              {match.player1?.name || 'TBD'} vs {match.player2?.name || 'TBD'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Status: {match.status === 'active' ? '🟢 Actief' : 
                                      match.status === 'completed' ? '✅ Voltooid' : 
                                      '⏸️ Wachtend'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

