import { Redis } from '@upstash/redis'

// Ensure we don't throw immediately on import if env vars are missing,
// but warn the user.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

/**
 * Cache wrapper utility.
 * @param key - The unique cache key.
 * @param fetcher - The function to call if there's a cache miss.
 * @param ttlSeconds - Time-to-live in seconds (default 60).
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  // If no URL/Token, just bypass cache
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return fetcher()
  }

  try {
    const cachedData = await redis.get<T>(key)
    if (cachedData !== null) {
      return cachedData
    }

    const data = await fetcher()

    if (data !== null && data !== undefined) {
      await redis.set(key, data, { ex: ttlSeconds })
    }

    return data
  } catch (error) {
    console.warn(`[Redis Cache Error] Key: ${key}`, error)
    // On cache failure, fallback to fetcher
    return fetcher()
  }
}
