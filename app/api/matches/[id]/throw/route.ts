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

    // Get or create current set
    let currentSet = match.sets[0];
    if (!currentSet) {
      currentSet = await prisma.set.create({
        data: {
          matchId,
          setNumber: match.currentSet,
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
          legNumber: match.currentLeg,
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

      // Update set scores
      const updatedSet = await prisma.set.update({
        where: { id: currentSet.id },
        data: {
          [isPlayer1 ? 'player1Legs' : 'player2Legs']: {
            increment: 1,
          },
        },
      });

      const player1Legs = isPlayer1 ? updatedSet.player1Legs : updatedSet.player1Legs;
      const player2Legs = isPlayer1 ? updatedSet.player2Legs : updatedSet.player2Legs;
      const legsToWin = match.tournament.legs;

      // Check for set win
      if ((isPlayer1 && updatedSet.player1Legs >= legsToWin) || 
          (!isPlayer1 && updatedSet.player2Legs >= legsToWin)) {
        
        await prisma.set.update({
          where: { id: currentSet.id },
          data: {
            status: 'completed',
            winnerId: playerId,
          },
        });

        // Update match sets
        const updatedMatch = await prisma.match.update({
          where: { id: matchId },
          data: {
            [isPlayer1 ? 'player1Sets' : 'player2Sets']: {
              increment: 1,
            },
            currentSet: { increment: 1 },
            currentLeg: 1,
          },
        });

        const setsToWin = match.tournament.sets;
        
        // Check for match win
        if ((isPlayer1 && updatedMatch.player1Sets >= setsToWin) || 
            (!isPlayer1 && updatedMatch.player2Sets >= setsToWin)) {
          
          await prisma.match.update({
            where: { id: matchId },
            data: {
              status: 'completed',
              winnerId: playerId,
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

          return NextResponse.json({ matchWon: true, setWon: true, legWon: true });
        }

        return NextResponse.json({ setWon: true, legWon: true });
      }

      // Start new leg
      await prisma.match.update({
        where: { id: matchId },
        data: {
          currentLeg: { increment: 1 },
        },
      });

      return NextResponse.json({ legWon: true });
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

