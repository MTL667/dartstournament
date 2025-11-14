import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        players: true,
        matches: {
          include: {
            player1: true,
            player2: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, format, sets, legs, startScore, playerNames, playersCount } = body;

    // Create tournament with players
    const tournament = await prisma.tournament.create({
      data: {
        name,
        type: type || 'single-elimination',
        format,
        sets: parseInt(sets),
        legs: parseInt(legs),
        startScore: parseInt(startScore),
        playersCount: playersCount || playerNames.length,
        status: 'setup',
        players: {
          create: playerNames.map((name: string, index: number) => ({
            name,
            seed: index + 1, // Seed based on order
          })),
        },
      },
      include: {
        players: {
          orderBy: {
            seed: 'asc',
          },
        },
      },
    });

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 });
  }
}

