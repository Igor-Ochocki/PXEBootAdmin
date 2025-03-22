export async function handleAuthError(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
  });
}
