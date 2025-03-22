"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const usos_1 = require("@/config/usos");
const oauth_1 = require("@/utils/oauth");
async function GET(request) {
    var _a, _b;
    try {
        const accessToken = (_a = request.cookies.get('access_token')) === null || _a === void 0 ? void 0 : _a.value;
        const accessTokenSecret = (_b = request.cookies.get('access_token_secret')) === null || _b === void 0 ? void 0 : _b.value;
        if (!accessToken || !accessTokenSecret) {
            return server_1.NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        // Get user data from USOS with specific fields
        const fields = 'id|first_name|last_name|photo_urls';
        const userDataUrl = `${usos_1.USOS_CONFIG.baseUrl}/services/users/user`;
        const authHeader = (0, oauth_1.getAuthorizationHeader)('GET', userDataUrl, {
            oauth_token: accessToken,
            fields: fields
        }, usos_1.USOS_CONFIG.consumerKey, usos_1.USOS_CONFIG.consumerSecret, accessTokenSecret);
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
        return server_1.NextResponse.json({
            id: userData.id,
            first_name: userData.first_name,
            last_name: userData.last_name,
            photo_urls: userData.photo_urls
        });
    }
    catch (error) {
        console.error('Error fetching user data:', error);
        return server_1.NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch user data' }, { status: 401 });
    }
}
