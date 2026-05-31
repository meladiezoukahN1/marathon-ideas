import { Redis } from "@upstash/redis"

function createClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token || !url.startsWith("https://")) return null
  return new Redis({ url, token })
}

export const redis = createClient()

export function getRedisOrThrow(): Redis {
  const r = redis
  if (!r) throw new Error("VOTING_TEMPORARILY_UNAVAILABLE")
  return r
}
