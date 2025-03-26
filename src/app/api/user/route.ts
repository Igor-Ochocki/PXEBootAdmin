import { NextRequest, NextResponse } from 'next/server';
import { USOS_CONFIG } from '@/config/usos';
import { getAuthorizationHeader } from '@/utils/oauth';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('access_token')?.value;
    const accessTokenSecret = request.cookies.get('access_token_secret')?.value;

    if (!accessToken || !accessTokenSecret) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user data from USOS with specific fields
    const fields = 'id|first_name|last_name|photo_urls';
    const userDataUrl = `${USOS_CONFIG.baseUrl}/services/users/user`;
    const authHeader = getAuthorizationHeader(
      'GET',
      userDataUrl,
      {
        oauth_token: accessToken,
        fields: fields
      },
      USOS_CONFIG.consumerKey,
      USOS_CONFIG.consumerSecret,
      accessTokenSecret
    );

    const response = await fetch(`${userDataUrl}?fields=${encodeURIComponent(fields)}`, {
      headers: {
        'Authorization': authHeader
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('USOS API Error:', {
        status: response.status,
        statusText: response.statusText,
        response: errorText
      });
      throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
    }

    const userData = await response.json();

    console.log(userData);

    return NextResponse.json({
      id: userData.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      photo_urls: userData.photo_urls
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch user data' },
      { status: 401 }
    );
  }
}
