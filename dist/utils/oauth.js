"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNonce = generateNonce;
exports.generateTimestamp = generateTimestamp;
exports.generateSignature = generateSignature;
exports.getAuthorizationHeader = getAuthorizationHeader;
const crypto_1 = __importDefault(require("crypto"));
function generateNonce() {
    return crypto_1.default.randomBytes(16).toString('hex');
}
function generateTimestamp() {
    return Math.floor(Date.now() / 1000).toString();
}
function generateSignature(method, url, params, consumerSecret, tokenSecret = '') {
    // Sort parameters alphabetically
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
    // Create signature base string
    const signatureBase = [
        method.toUpperCase(),
        encodeURIComponent(url),
        encodeURIComponent(sortedParams)
    ].join('&');
    // Create signing key
    const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
    // Generate HMAC-SHA1 signature
    const hmac = crypto_1.default.createHmac('sha1', signingKey);
    hmac.update(signatureBase);
    return hmac.digest('base64');
}
function getAuthorizationHeader(method, url, params, consumerKey, consumerSecret, tokenSecret = '') {
    const nonce = generateNonce();
    const timestamp = generateTimestamp();
    const oauthParams = {
        oauth_consumer_key: consumerKey,
        oauth_nonce: nonce,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: timestamp,
        oauth_version: '1.0',
        ...params
    };
    const signature = generateSignature(method, url, oauthParams, consumerSecret, tokenSecret);
    const authHeader = Object.entries(oauthParams)
        .map(([key, value]) => `${encodeURIComponent(key)}="${encodeURIComponent(value)}"`)
        .join(', ');
    return `OAuth ${authHeader}, oauth_signature="${encodeURIComponent(signature)}"`;
}
