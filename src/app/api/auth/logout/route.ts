import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear all auth-related cookies
  response.cookies.delete('access_token');
  response.cookies.delete('access_token_secret');
  response.cookies.delete('oauth_token_secret');

  return response;
}
