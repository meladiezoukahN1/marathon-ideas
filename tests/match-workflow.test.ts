import { describe, expect, it } from "vitest";

import {
  MATCH_PHASE_TRANSITIONS,
  assertValidMatchPhaseTransition,
} from "../src/server/modules/matches/workflow";

describe("match workflow transitions", () => {
  for (const [from, allowedTargets] of Object.entries(MATCH_PHASE_TRANSITIONS)) {
    for (const to of allowedTargets) {
      it(`allows transition ${from} -> ${to}`, () => {
        expect(() => assertValidMatchPhaseTransition(from, to)).not.toThrow();
      });
    }
  }

  it("fails for illegal jumps", () => {
    expect(() => assertValidMatchPhaseTransition("WAITING", "VOTING")).toThrow(
      "Illegal match phase transition",
    );
  });

  it("fails for same-state transitions", () => {
    expect(() => assertValidMatchPhaseTransition("VOTING", "VOTING")).toThrow(
      "Same-state match transition is not allowed",
    );
  });

  it("fails for unknown source state", () => {
    expect(() => assertValidMatchPhaseTransition("UNKNOWN", "VOTING")).toThrow(
      "Unsupported match phase transition",
    );
  });

  it("fails for unknown target state", () => {
    expect(() => assertValidMatchPhaseTransition("VOTING", "UNKNOWN")).toThrow(
      "Unsupported match phase transition",
    );
  });
});
