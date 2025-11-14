import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Called when a match is completed to progress bracket
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true,
        player1: true,
        player2: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.status !== 'completed' || !match.winnerId) {
      return NextResponse.json({ 
        error: 'Match is not completed or has no winner' 
      }, { status: 400 });
    }

    const loserId = match.player1Id === match.winnerId ? match.player2Id : match.player1Id;

    // Update loser ID
    await prisma.match.update({
      where: { id: matchId },
      data: { loserId },
    });

    // Progress winner to next match
    if (match.winnerNextMatchId && match.winnerSlot) {
      await prisma.match.update({
        where: { id: match.winnerNextMatchId },
        data: {
          [match.winnerSlot === 'player1' ? 'player1Id' : 'player2Id']: match.winnerId,
        },
      });

      // Check if next match is ready to start
      const nextMatch = await prisma.match.findUnique({
        where: { id: match.winnerNextMatchId },
      });

      if (nextMatch && nextMatch.player1Id && nextMatch.player2Id && nextMatch.status === 'pending') {
        // Check if there are any active matches - if not, activate this one
        const activeMatches = await prisma.match.count({
          where: {
            tournamentId: match.tournamentId,
            status: 'active',
          },
        });

        if (activeMatches === 0) {
          await prisma.match.update({
            where: { id: match.winnerNextMatchId },
            data: { status: 'active' },
          });
        }
      }
    }

    // Progress loser to losers bracket (if applicable)
    if (match.loserNextMatchId && match.loserSlot && loserId) {
      await prisma.match.update({
        where: { id: match.loserNextMatchId },
        data: {
          [match.loserSlot === 'player1' ? 'player1Id' : 'player2Id']: loserId,
        },
      });

      // Check if loser's next match is ready
      const nextMatch = await prisma.match.findUnique({
        where: { id: match.loserNextMatchId },
      });

      if (nextMatch && nextMatch.player1Id && nextMatch.player2Id && nextMatch.status === 'pending') {
        const activeMatches = await prisma.match.count({
          where: {
            tournamentId: match.tournamentId,
            status: 'active',
          },
        });

        if (activeMatches === 0) {
          await prisma.match.update({
            where: { id: match.loserNextMatchId },
            data: { status: 'active' },
          });
        }
      }
    }

    // Check if tournament is completed (grand final done)
    if (match.bracket === 'winners' && match.round === 1 && match.position === 1) {
      // This might be grand final - check if it's the last match
      const pendingMatches = await prisma.match.count({
        where: {
          tournamentId: match.tournamentId,
          status: { in: ['pending', 'active'] },
        },
      });

      if (pendingMatches === 0) {
        await prisma.tournament.update({
          where: { id: match.tournamentId },
          data: { status: 'completed' },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing match:', error);
    return NextResponse.json({ error: 'Failed to complete match' }, { status: 500 });
  }
}

