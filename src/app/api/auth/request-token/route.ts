import { NextRequest, NextResponse } from 'next/server';
import { USOS_CONFIG } from '@/config/usos';
import { getAuthorizationHeader } from '@/utils/oauth';

export async function GET(request: NextRequest) {
  try {
    const requestTokenUrl = `${USOS_CONFIG.baseUrl}/services/oauth/request_token`;

    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto');
    const hostUrl = `${protocol}://${host}`;

    const callbackUrl = `${hostUrl}/api/auth/callback?host=${hostUrl}`;

    // Log the configuration (without sensitive data)
    console.log('USOS Configuration:', {
      baseUrl: USOS_CONFIG.baseUrl,
      callbackUrl: callbackUrl,
      consumerKey: USOS_CONFIG.consumerKey,
      scopes: USOS_CONFIG.scopes
    });

    const requestParams = {
      oauth_callback: callbackUrl,
      scopes: USOS_CONFIG.scopes
    };

    const authHeader = getAuthorizationHeader(
      'GET',
      requestTokenUrl,
      requestParams,
      USOS_CONFIG.consumerKey,
      USOS_CONFIG.consumerSecret
    );

    console.log('Request URL:', requestTokenUrl);
    console.log('Auth Header:', authHeader);

    const usosResponse = await fetch(requestTokenUrl, {
      headers: {
        'Authorization': authHeader
      }
    });

    if (!usosResponse.ok) {
      const errorText = await usosResponse.text();
      console.error('USOS API Error:', {
        status: usosResponse.status,
        statusText: usosResponse.statusText,
        response: errorText
      });
      throw new Error(`Failed to get request token: ${usosResponse.status} ${usosResponse.statusText}`);
    }

    const responseData = await usosResponse.text();
    console.log('USOS Response:', responseData);

    const responseParams = new URLSearchParams(responseData);
    const oauthToken = responseParams.get('oauth_token');
    const oauthTokenSecret = responseParams.get('oauth_token_secret');

    if (!oauthToken || !oauthTokenSecret) {
      throw new Error('Invalid response from USOS');
    }

    // Store the token secret in a secure HTTP-only cookie
    const nextResponse = NextResponse.json({ oauthToken });
    nextResponse.cookies.set('oauth_token_secret', oauthTokenSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return nextResponse;
  } catch (error) {
    console.error('Error requesting token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to request token' },
      { status: 500 }
    );
  }
}
