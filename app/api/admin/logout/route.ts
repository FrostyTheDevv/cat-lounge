import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  const cookie = serialize('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return new NextResponse(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: { 'Set-Cookie': cookie },
    }
  );
}
