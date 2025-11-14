import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { passcode } = body;

    const correctPasscode = process.env.MATCH_PASSCODE || '1234';

    if (passcode === correctPasscode) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false }, { status: 401 });
  } catch (error) {
    console.error('Error verifying passcode:', error);
    return NextResponse.json({ error: 'Failed to verify passcode' }, { status: 500 });
  }
}

