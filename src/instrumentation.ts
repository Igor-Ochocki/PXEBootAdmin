export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const db = await import('@/lib/utils/db');
    await db.initDB();
    await import('@/scripts/populate-systems');
  }
}