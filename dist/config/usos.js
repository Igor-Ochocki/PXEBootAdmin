"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USOS_CONFIG = void 0;
exports.USOS_CONFIG = {
    baseUrl: 'https://apps.usos.pw.edu.pl',
    consumerKey: process.env.NEXT_PUBLIC_USOS_CONSUMER_KEY || '',
    consumerSecret: process.env.USOS_CONSUMER_SECRET || '',
    callbackUrl: process.env.NEXT_PUBLIC_USOS_CALLBACK_URL || '/api/auth/callback',
    scopes: 'email|photo|profile'
};
