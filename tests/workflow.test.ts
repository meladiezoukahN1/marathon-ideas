import { assertCanFinalizeResult, WorkflowError } from "@/server/modules/matches/workflow"

describe("assertCanFinalizeResult", () => {
  const pastEnd = new Date(Date.now() - 60000).toISOString()
  const futureEnd = new Date(Date.now() + 60000).toISOString()

  it("allows when phase is VOTING and votingTimerStatus is FINISHED", () => {
    expect(() => assertCanFinalizeResult("VOTING", "FINISHED", pastEnd)).not.toThrow()
  })

  it("allows when phase is VOTING and votingTimerStatus is PAUSED", () => {
    expect(() => assertCanFinalizeResult("VOTING", "PAUSED", futureEnd)).not.toThrow()
  })

  it("allows when phase is VOTING and votingEndsAt has passed (natural expiry)", () => {
    expect(() => assertCanFinalizeResult("VOTING", "RUNNING", pastEnd)).not.toThrow()
  })

  it("allows when phase is RESULT (idempotent re-reveal)", () => {
    expect(() => assertCanFinalizeResult("RESULT", "RUNNING", futureEnd)).not.toThrow()
  })

  it("blocks when phase is PRESENTING", () => {
    expect(() => assertCanFinalizeResult("PRESENTING", "FINISHED", pastEnd))
      .toThrow(WorkflowError)
  })

  it("blocks when phase is WAITING", () => {
    expect(() => assertCanFinalizeResult("WAITING")).toThrow(WorkflowError)
  })

  it("blocks when phase is FINISHED", () => {
    expect(() => assertCanFinalizeResult("FINISHED")).toThrow(WorkflowError)
  })

  it("blocks when phase is VOTING but voting timer is RUNNING and voting not expired", () => {
    expect(() => assertCanFinalizeResult("VOTING", "RUNNING", futureEnd))
      .toThrow(WorkflowError)
  })

  it("blocks when phase is VOTING and voting has not started (no endsAt)", () => {
    expect(() => assertCanFinalizeResult("VOTING", "READY", null))
      .toThrow(WorkflowError)
  })

  it("error message is 'Can only finalize result after voting ends'", () => {
    expect(() => assertCanFinalizeResult("PRESENTING")).toThrow("Can only finalize result after voting ends")
    expect(() => assertCanFinalizeResult("WAITING")).toThrow("Can only finalize result after voting ends")
    expect(() => assertCanFinalizeResult("FINISHED")).toThrow("Can only finalize result after voting ends")
    expect(() => assertCanFinalizeResult("VOTING", "RUNNING", futureEnd)).toThrow("Can only finalize result after voting ends")
  })
})
