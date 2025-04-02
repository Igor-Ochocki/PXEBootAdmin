import { fetchUserFields } from '@/utils/userFieldsFetch';
import { NextRequest, NextResponse } from 'next/server';

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

    const userData = await fetchUserFields({
      accessToken: accessToken,
      accessTokenSecret: accessTokenSecret,
      fields: 'id|first_name|last_name|photo_urls'
    });

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
