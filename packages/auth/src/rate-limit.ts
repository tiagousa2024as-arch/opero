import Redis from "ioredis";

/**
 * Fixed-window rate limiter for auth endpoints (login, signup) — the
 * concrete use PART B has in mind for Phase 3 Redis ("rate limiting").
 * Falls back to an in-memory Map when REDIS_URL isn't set, which is fine
 * for local dev but resets on every redeploy and doesn't share state
 * across multiple instances — set REDIS_URL in production.
 */

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  if (!process.env.REDIS_URL) return null;
  redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true });
  redis.on("error", (err) => console.error("[rate-limit] redis error", err));
  return redis;
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/** Allows `limit` calls per `windowSeconds` for a given key (e.g. `login:<ip>`). */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const client = getRedis();

  if (client) {
    try {
      const redisKey = `ratelimit:${key}`;
      const count = await client.incr(redisKey);
      if (count === 1) {
        await client.expire(redisKey, windowSeconds);
      }
      return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
    } catch (err) {
      console.error("[rate-limit] falling back to in-memory (redis unavailable)", err);
      // fall through to in-memory below
    }
  }

  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }
  entry.count++;
  return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count) };
}
