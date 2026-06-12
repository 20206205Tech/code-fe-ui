// file: lib/swr-helper.ts

/**
 * Executes a Stale-While-Revalidate (SWR) cache strategy.
 * 1. Checks if data is cached in localStorage. If so, immediately invokes onData callback.
 * 2. Fetches fresh data via the fetcher in the background.
 * 3. Compares the fresh data with the cached data.
 * 4. If changed (or not cached), updates the cache in localStorage and invokes onData callback.
 * 5. Returns a promise resolving to the fresh data (or cached data if the fetch fails).
 */
export async function executeSWR<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  onData?: (data: T) => void
): Promise<T> {
  const isBrowser = typeof window !== 'undefined';
  let cachedData: T | null = null;

  // 1. Get cached data from localStorage immediately
  if (isBrowser) {
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        cachedData = JSON.parse(stored);
        if (cachedData !== null && onData) {
          onData(cachedData);
        }
      }
    } catch (e) {
      console.error(`SWR read error for key "${cacheKey}":`, e);
    }
  }

  // 2. Fetch fresh data in the background
  try {
    const freshData = await fetcher();

    // 3. Compare with cached data and update if changed
    if (isBrowser) {
      try {
        const freshStr = JSON.stringify(freshData);
        const cachedStr = cachedData ? JSON.stringify(cachedData) : null;

        if (freshStr !== cachedStr) {
          localStorage.setItem(cacheKey, freshStr);
          if (onData) {
            onData(freshData);
          }
        }
      } catch (e) {
        console.error(`SWR write error for key "${cacheKey}":`, e);
      }
    }

    return freshData;
  } catch (error) {
    console.error(`SWR fetch error for key "${cacheKey}":`, error);
    // Fallback to cached data if background fetch fails
    if (cachedData !== null) {
      return cachedData;
    }
    throw error;
  }
}
