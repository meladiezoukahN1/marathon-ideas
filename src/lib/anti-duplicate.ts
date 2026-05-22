import { createHash } from "node:crypto";

export function hashIp(ip: string, matchId: string): string {
  const salt = process.env.VOTE_HASH_SALT;

  if (!salt) {
    throw new Error("VOTE_HASH_SALT is required");
  }

  return createHash("sha256").update(`${ip}:${matchId}:${salt}`).digest("hex");
}
