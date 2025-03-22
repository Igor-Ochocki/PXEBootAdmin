"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
async function POST() {
    const response = server_1.NextResponse.json({ success: true });
    // Clear all auth-related cookies
    response.cookies.delete('access_token');
    response.cookies.delete('access_token_secret');
    response.cookies.delete('oauth_token_secret');
    return response;
}
