const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface FetchWithRetryOptions {
  retries?: number;
  retryDelay?: number;
  auth?: {
    username: string;
    password: string;
  };
  headers?: Record<string, string>;
}

export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    retries = 5,
    retryDelay = 1000,
    auth,
    headers = {}
  } = options;

  // Add basic auth if credentials are provided
  if (auth) {
    const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          ...headers,
          'Accept': '*/*',  // Similar to curl's default behavior
        },
        // Similar to curl's --anyauth and -k options
        credentials: 'include',
      });

      // Check if we need to retry based on response status
      if (!response.ok && attempt < retries - 1) {
        await wait(retryDelay);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // If this was our last attempt, throw the error
      if (attempt === retries - 1) {
        throw new Error(`Failed after ${retries} attempts: ${lastError.message}`);
      }

      // Wait before retrying
      await wait(retryDelay);
    }
  }

  // This should never be reached due to the throw above, but TypeScript needs it
  throw lastError || new Error('Unknown error occurred');
}
