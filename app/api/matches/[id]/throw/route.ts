import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;
    const body = await request.json();
    const { playerId, score, dart1, dart2, dart3 } = body;

    // Get current match state
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true,
        sets: {
          where: { status: 'active' },
          include: {
            legs: {
              where: { status: 'active' },
              include: {
                throws: true,
              },
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get or create current set (we still need this for DB structure, but treat it as a single set)
    let currentSet = match.sets[0];
    if (!currentSet) {
      currentSet = await prisma.set.create({
        data: {
          matchId,
          setNumber: 1,
          status: 'active',
        },
        include: {
          legs: {
            include: {
              throws: true,
            },
          },
        },
      });
    }

    // Get or create current leg
    let currentLeg = currentSet.legs.find(l => l.status === 'active');
    if (!currentLeg) {
      const newLeg = await prisma.leg.create({
        data: {
          setId: currentSet.id,
          legNumber: currentSet.legs.length + 1,
          player1Score: match.tournament.startScore,
          player2Score: match.tournament.startScore,
          startingPlayer: match.startingPlayer || match.player1Id || '',
          currentPlayer: match.currentPlayer || match.player1Id || '',
          status: 'active',
        },
        include: {
          throws: true,
        },
      });
      currentLeg = newLeg;
    }

    // Calculate new remaining score
    const isPlayer1 = playerId === match.player1Id;
    const currentScore = isPlayer1 ? currentLeg.player1Score : currentLeg.player2Score;
    const newScore = currentScore - score;

    // Check for bust (score below 0 or exactly 1)
    if (newScore < 0 || newScore === 1) {
      // Bust - no score change, switch player
      await prisma.throw.create({
        data: {
          legId: currentLeg.id,
          playerId,
          score: 0,
          remaining: currentScore,
          dart1,
          dart2,
          dart3,
        },
      });

      await prisma.leg.update({
        where: { id: currentLeg.id },
        data: {
          currentPlayer: isPlayer1 ? (match.player2Id || '') : (match.player1Id || ''),
        },
      });

      return NextResponse.json({ bust: true, remaining: currentScore });
    }

    // Record throw
    await prisma.throw.create({
      data: {
        legId: currentLeg.id,
        playerId,
        score,
        remaining: newScore,
        dart1,
        dart2,
        dart3,
      },
    });

    // Check for leg win
    if (newScore === 0) {
      // Update leg winner
      await prisma.leg.update({
        where: { id: currentLeg.id },
        data: {
          [isPlayer1 ? 'player1Score' : 'player2Score']: newScore,
          status: 'completed',
          winnerId: playerId,
        },
      });

      // Update leg count in set (we use this to track total legs won)
      const updatedSet = await prisma.set.update({
        where: { id: currentSet.id },
        data: {
          [isPlayer1 ? 'player1Legs' : 'player2Legs']: {
            increment: 1,
          },
        },
      });

      const player1Legs = updatedSet.player1Legs;
      const player2Legs = updatedSet.player2Legs;
      const legsToWin = match.tournament.legs;

      // Check for match win (Best of X legs)
      if ((isPlayer1 && player1Legs >= legsToWin) || 
          (!isPlayer1 && player2Legs >= legsToWin)) {
        
        await prisma.set.update({
          where: { id: currentSet.id },
          data: {
            status: 'completed',
            winnerId: playerId,
          },
        });

        await prisma.match.update({
          where: { id: matchId },
          data: {
            status: 'completed',
            winnerId: playerId,
            loserId: isPlayer1 ? match.player2Id : match.player1Id,
          },
        });

        // Progress bracket automatically
        try {
          await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/matches/${matchId}/complete`, {
            method: 'POST',
          });
        } catch (error) {
          console.error('Failed to progress bracket:', error);
        }

        return NextResponse.json({ matchWon: true, legWon: true, player1Legs, player2Legs });
      }

      return NextResponse.json({ legWon: true, player1Legs, player2Legs });
    }

    // Update score and switch player
    await prisma.leg.update({
      where: { id: currentLeg.id },
      data: {
        [isPlayer1 ? 'player1Score' : 'player2Score']: newScore,
        currentPlayer: isPlayer1 ? (match.player2Id || '') : (match.player1Id || ''),
      },
    });

    return NextResponse.json({ remaining: newScore });
  } catch (error) {
    console.error('Error recording throw:', error);
    return NextResponse.json({ error: 'Failed to record throw' }, { status: 500 });
  }
}

