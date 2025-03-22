"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAuthError = handleAuthError;
async function handleAuthError() {
    await fetch('/api/auth/logout', {
        method: 'POST',
    });
}
