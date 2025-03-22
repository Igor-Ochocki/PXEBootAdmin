"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const usos_1 = require("@/config/usos");
const oauth_1 = require("@/utils/oauth");
async function GET(request) {
    var _a;
    try {
        const searchParams = request.nextUrl.searchParams;
        const oauthToken = searchParams.get('oauth_token');
        const oauthVerifier = searchParams.get('oauth_verifier');
        const oauthTokenSecret = (_a = request.cookies.get('oauth_token_secret')) === null || _a === void 0 ? void 0 : _a.value;
        if (!oauthToken || !oauthVerifier || !oauthTokenSecret) {
            throw new Error('Missing required OAuth parameters');
        }
        const accessTokenUrl = `${usos_1.USOS_CONFIG.baseUrl}/services/oauth/access_token`;
        const params = {
            oauth_token: oauthToken,
            oauth_verifier: oauthVerifier
        };
        const authHeader = (0, oauth_1.getAuthorizationHeader)('GET', accessTokenUrl, params, usos_1.USOS_CONFIG.consumerKey, usos_1.USOS_CONFIG.consumerSecret, oauthTokenSecret);
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
        const nextResponse = server_1.NextResponse.redirect(new URL('/', request.url));
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
    }
    catch (error) {
        console.error('Error in callback:', error);
        return server_1.NextResponse.redirect(new URL('/auth/error', request.url));
    }
}
