"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWithDigest = fetchWithDigest;
const crypto_1 = __importDefault(require("crypto"));
// Parse the WWW-Authenticate header to get necessary parts
function parseAuthHeader(authHeader) {
    const regex = /(\w+)="([^"]+)"/g;
    const authParams = {
        realm: '',
        nonce: ''
    };
    let match;
    while (match = regex.exec(authHeader)) {
        authParams[match[1]] = match[2];
    }
    if (!authParams.realm || !authParams.nonce) {
        throw new Error('Missing required digest authentication parameters');
    }
    return authParams;
}
// Construct the Digest Authorization header
function constructDigestAuthHeader(authParams, options) {
    const { realm, nonce } = authParams;
    const { url, username, password } = options;
    // Generate cnonce and nc (nonce count)
    const cnonce = crypto_1.default.randomBytes(16).toString('hex');
    const nc = '00000001';
    const qop = 'auth';
    // Create A1 and A2 hashes (used in Digest calculation)
    const A1 = `${username}:${realm}:${password}`;
    const A2 = `GET:${url}`;
    const ha1 = crypto_1.default.createHash('md5').update(A1).digest('hex');
    const ha2 = crypto_1.default.createHash('md5').update(A2).digest('hex');
    // Generate the response hash (Digest Authentication response)
    const response = crypto_1.default.createHash('md5').update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).digest('hex');
    // Construct the final Digest Authorization header
    return `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${url}", cnonce="${cnonce}", nc=${nc}, qop=${qop}, response="${response}"`;
}
// 1. First, we make a request to get the WWW-Authenticate header.
async function getDigestHeader(options) {
    try {
        const response = await fetch(options.url, {
            method: 'GET',
            headers: {
                'User-Agent': 'node-fetch',
                'Accept': '*/*',
            },
        });
        const wwwAuthenticate = response.headers.get('www-authenticate');
        if (!wwwAuthenticate) {
            throw new Error('No WWW-Authenticate header received');
        }
        // Parse the Digest Authentication challenge
        const authParams = parseAuthHeader(wwwAuthenticate);
        const digestHeader = constructDigestAuthHeader(authParams, options);
        return digestHeader;
    }
    catch (error) {
        console.error('Error in getting WWW-Authenticate header:', error);
        return undefined;
    }
}
// 2. Once we have the Digest Authorization header, we can send the second request.
async function fetchWithDigest(url, username, password) {
    const options = { url, username, password };
    const digestHeader = await getDigestHeader(options);
    if (!digestHeader) {
        console.error('Unable to get Digest Authorization header.');
        return undefined;
    }
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': digestHeader,
                'User-Agent': 'node-fetch',
                'Accept': '*/*',
            },
        });
        const body = await response.text();
        return body;
    }
    catch (error) {
        console.error('Error fetching data:', error);
        return undefined;
    }
}
