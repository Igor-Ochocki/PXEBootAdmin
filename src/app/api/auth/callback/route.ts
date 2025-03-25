import { NextRequest, NextResponse } from 'next/server';
import { USOS_CONFIG } from '@/config/usos';
import { getAuthorizationHeader } from '@/utils/oauth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const oauthToken = searchParams.get('oauth_token');
    const oauthVerifier = searchParams.get('oauth_verifier');
    const oauthTokenSecret = request.cookies.get('oauth_token_secret')?.value;
    const host = request.nextUrl.searchParams.get('host') || 'localhost:3000';

    if (!oauthToken || !oauthVerifier || !oauthTokenSecret) {
      throw new Error('Missing required OAuth parameters');
    }

    const accessTokenUrl = `${USOS_CONFIG.baseUrl}/services/oauth/access_token`;

    const params = {
      oauth_token: oauthToken,
      oauth_verifier: oauthVerifier
    };

    const authHeader = getAuthorizationHeader(
      'GET',
      accessTokenUrl,
      params,
      USOS_CONFIG.consumerKey,
      USOS_CONFIG.consumerSecret,
      oauthTokenSecret
    );

    const response = await fetch(accessTokenUrl, {
      headers: {
        'Authorization': authHeader
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.text();
    const responseParams = new URLSearchParams(data);
    const accessToken = responseParams.get('oauth_token');
    const accessTokenSecret = responseParams.get('oauth_token_secret');

    if (!accessToken || !accessTokenSecret) {
      throw new Error('Invalid response from USOS');
    }

    // Store the access tokens in secure HTTP-only cookies
    const nextResponse = NextResponse.redirect(new URL('/', host));
    nextResponse.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    nextResponse.cookies.set('access_token_secret', accessTokenSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return nextResponse;
  } catch (error) {
    console.error('Error in callback:', error);
    return NextResponse.redirect(new URL('/auth/error', request.nextUrl.searchParams.get('host') || 'localhost:3000'));
  }
}
