import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get throw details before deleting
    const throwData = await prisma.throw.findUnique({
      where: { id },
      include: {
        leg: {
          include: {
            set: {
              include: {
                match: true,
              },
            },
          },
        },
      },
    });

    if (!throwData) {
      return NextResponse.json({ error: 'Throw not found' }, { status: 404 });
    }

    const leg = throwData.leg;
    const playerId = throwData.playerId;
    const score = throwData.score;
    const isPlayer1 = playerId === leg.set.match.player1Id;

    // Restore the score (add back what was subtracted)
    await prisma.leg.update({
      where: { id: leg.id },
      data: {
        [isPlayer1 ? 'player1Score' : 'player2Score']: {
          increment: score,
        },
        // Switch back to previous player (the one who just threw)
        currentPlayer: playerId,
      },
    });

    // Delete the throw
    await prisma.throw.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting throw:', error);
    return NextResponse.json({ error: 'Failed to delete throw' }, { status: 500 });
  }
}

