import { describe, expect, it } from "vitest";

import {
  DISPLAY_MODE_TRANSITIONS,
  assertValidDisplayTransition,
} from "../src/server/modules/event-control/workflow";

describe("event-control workflow transitions", () => {
  for (const [from, allowedTargets] of Object.entries(DISPLAY_MODE_TRANSITIONS)) {
    for (const to of allowedTargets) {
      it(`allows transition ${from} -> ${to}`, () => {
        expect(() => assertValidDisplayTransition(from, to)).not.toThrow();
      });
    }
  }

  it("fails for illegal jumps", () => {
    expect(() => assertValidDisplayTransition("EVENT_WAITING", "VOTING")).toThrow(
      "Illegal display transition",
    );
  });

  it("fails for same-state transitions", () => {
    expect(() => assertValidDisplayTransition("BRACKET_PREVIEW", "BRACKET_PREVIEW")).toThrow(
      "Same-state display transition is not allowed",
    );
  });

  it("fails for unknown source state", () => {
    expect(() => assertValidDisplayTransition("UNKNOWN", "VOTING")).toThrow(
      "Unsupported display mode transition",
    );
  });

  it("fails for unknown target state", () => {
    expect(() => assertValidDisplayTransition("VOTING", "UNKNOWN")).toThrow(
      "Unsupported display mode transition",
    );
  });
});
