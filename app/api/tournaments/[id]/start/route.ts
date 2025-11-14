import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDoubleEliminationBracket } from '@/lib/bracket';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get tournament with players
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        players: {
          orderBy: {
            seed: 'asc',
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (tournament.type === 'double-elimination') {
      if (tournament.players.length !== 8) {
        return NextResponse.json({ 
          error: 'Double elimination requires exactly 8 players' 
        }, { status: 400 });
      }

      // Generate bracket structure
      const bracketStructure = generateDoubleEliminationBracket();
      
      // Create matches with bracket information
      const matchIdMap = new Map<string, string>();
      
      // First pass: Create all matches
      for (const bracket of bracketStructure) {
        const matchData: any = {
          tournamentId: id,
          bracket: bracket.bracket === 'grand-final' ? 'winners' : bracket.bracket,
          round: bracket.round,
          position: bracket.position,
          status: 'pending',
        };

        // Assign players for first round of winners bracket
        if (bracket.bracket === 'winners' && bracket.round === 1) {
          if (bracket.player1Seed && bracket.player2Seed) {
            const player1 = tournament.players[bracket.player1Seed - 1];
            const player2 = tournament.players[bracket.player2Seed - 1];
            
            if (player1 && player2) {
              matchData.player1Id = player1.id;
              matchData.player2Id = player2.id;
              matchData.status = 'pending'; // All pending until first one is activated
            }
          }
        }

        const match = await prisma.match.create({
          data: matchData,
        });

        matchIdMap.set((bracket as any).id, match.id);
      }

      // Second pass: Update next match references
      for (const bracket of bracketStructure) {
        const currentMatchId = matchIdMap.get((bracket as any).id);
        if (!currentMatchId) continue;

        const updateData: any = {};

        if (bracket.winnerNextMatchId) {
          updateData.winnerNextMatchId = matchIdMap.get(bracket.winnerNextMatchId);
          updateData.winnerSlot = bracket.winnerSlot;
        }

        if (bracket.loserNextMatchId) {
          updateData.loserNextMatchId = matchIdMap.get(bracket.loserNextMatchId);
          updateData.loserSlot = bracket.loserSlot;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.match.update({
            where: { id: currentMatchId },
            data: updateData,
          });
        }
      }

      // Activate first match
      const firstMatch = await prisma.match.findFirst({
        where: {
          tournamentId: id,
          bracket: 'winners',
          round: 1,
          position: 1,
        },
      });

      if (firstMatch) {
        await prisma.match.update({
          where: { id: firstMatch.id },
          data: { status: 'active' },
        });
      }
    } else {
      // Simple bracket for other tournament types
      if (tournament.players.length < 2) {
        return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 });
      }

      const players = tournament.players;
      const matches = [];

      for (let i = 0; i < players.length; i += 2) {
        if (i + 1 < players.length) {
          matches.push({
            tournamentId: id,
            bracket: 'winners',
            round: 1,
            position: i / 2 + 1,
            player1Id: players[i].id,
            player2Id: players[i + 1].id,
            status: i === 0 ? 'active' : 'pending',
          });
        }
      }

      await prisma.match.createMany({
        data: matches,
      });
    }

    // Update tournament status
    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: { status: 'active' },
      include: {
        players: true,
        matches: {
          include: {
            player1: true,
            player2: true,
          },
          orderBy: [
            { bracket: 'asc' },
            { round: 'asc' },
            { position: 'asc' },
          ],
        },
      },
    });

    return NextResponse.json(updatedTournament);
  } catch (error) {
    console.error('Error starting tournament:', error);
    return NextResponse.json({ error: 'Failed to start tournament' }, { status: 500 });
  }
}

