"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const usos_1 = require("@/config/usos");
const oauth_1 = require("@/utils/oauth");
async function GET(request) {
    try {
        const requestTokenUrl = `${usos_1.USOS_CONFIG.baseUrl}/services/oauth/request_token`;
        const callbackUrl = `${request.headers.get('host')}/api/auth/callback`;
        // Log the configuration (without sensitive data)
        console.log('USOS Configuration:', {
            baseUrl: usos_1.USOS_CONFIG.baseUrl,
            callbackUrl: callbackUrl,
            consumerKey: usos_1.USOS_CONFIG.consumerKey,
            scopes: usos_1.USOS_CONFIG.scopes
        });
        const requestParams = {
            oauth_callback: callbackUrl,
            scopes: usos_1.USOS_CONFIG.scopes
        };
        const authHeader = (0, oauth_1.getAuthorizationHeader)('GET', requestTokenUrl, requestParams, usos_1.USOS_CONFIG.consumerKey, usos_1.USOS_CONFIG.consumerSecret);
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
        const nextResponse = server_1.NextResponse.json({ oauthToken });
        nextResponse.cookies.set('oauth_token_secret', oauthTokenSecret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });
        return nextResponse;
    }
    catch (error) {
        console.error('Error requesting token:', error);
        return server_1.NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to request token' }, { status: 500 });
    }
}
