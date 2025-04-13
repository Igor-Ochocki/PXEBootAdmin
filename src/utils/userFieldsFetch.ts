import { USOS_CONFIG } from '@/config/usos';
import { getAdmins } from '@/lib/utils/db';
import { getAuthorizationHeader } from '@/utils/oauth';
import { NextResponse, NextRequest } from 'next/server';

export enum UserStatus {
  NOT_ALLOWED = -1,
  NOT_A_STUDENT = 0,
  INACTIVE_STUDENT = 1,
  ACTIVE_STUDENT = 2,
}

export interface FetchUsedFieldsParams {
  accessToken: string;
  accessTokenSecret: string;
  fields: string;
}

export const fetchUserFields = async (params: FetchUsedFieldsParams) => {
  const { accessToken, accessTokenSecret, fields } = params;

    if (!accessToken || !accessTokenSecret) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user data from USOS with specific fields
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
    return userData;
}

export const isUserAdmin = async (request: NextRequest) => {
  const res = await getUserId(request)
  const data = await res.json();
  const userId = data.id;
  const admins = await getAdmins()
  return admins.some(admin => admin.userId === userId)
}

export const getUserId = async (request: NextRequest) => {
  const accessToken = request.cookies.get('access_token')?.value;
  const accessTokenSecret = request.cookies.get('access_token_secret')?.value;


  if (!accessToken || !accessTokenSecret) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const userStatus = await fetchUserFields({
    accessToken: accessToken,
    accessTokenSecret: accessTokenSecret,
    fields: 'id'
  });

  if (!userStatus.id) {
    return NextResponse.json(
      { error: 'User data not found' },
      { status: 404 }
    );
  }
  return NextResponse.json({
    status: 200,
    id: userStatus.id
  });
}

export const getUserStatus = async (request: NextRequest) => {
  const accessToken = request.cookies.get('access_token')?.value;
  const accessTokenSecret = request.cookies.get('access_token_secret')?.value;


  if (!accessToken || !accessTokenSecret) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const userStatus = await fetchUserFields({
    accessToken: accessToken,
    accessTokenSecret: accessTokenSecret,
    fields: 'student_status'
  });

  if (userStatus.student_status === UserStatus.ACTIVE_STUDENT) {
    return NextResponse.json({
      status: 200
    });
  } else {
    return NextResponse.json({
      status: 403
    });
  }
}