import { beforeEach, describe, expect, it } from "vitest";

import { hashIp } from "../src/lib/anti-duplicate";

describe("hashIp", () => {
  beforeEach(() => {
    process.env.VOTE_HASH_SALT = "test-salt";
  });

  it("returns stable SHA-256 hash for same ip and matchId", () => {
    const first = hashIp("192.168.1.1", "match-1");
    const second = hashIp("192.168.1.1", "match-1");

    expect(first).toBe(second);
  });

  it("produces different hash for different matchId", () => {
    const first = hashIp("192.168.1.1", "match-1");
    const second = hashIp("192.168.1.1", "match-2");

    expect(first).not.toBe(second);
  });

  it("produces different hash for different ip", () => {
    const first = hashIp("192.168.1.1", "match-1");
    const second = hashIp("10.0.0.8", "match-1");

    expect(first).not.toBe(second);
  });

  it("returns SHA-256 hex output with length 64", () => {
    const value = hashIp("192.168.1.1", "match-1");

    expect(value).toHaveLength(64);
    expect(value).toMatch(/^[a-f0-9]{64}$/);
  });

  it("does not expose the raw ip in the output", () => {
    const rawIp = "192.168.1.1";
    const value = hashIp(rawIp, "match-1");

    expect(value).not.toContain(rawIp);
  });
});
