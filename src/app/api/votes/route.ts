import { NextRequest, NextResponse } from "next/server"
import { submitPublicVote } from "@/server/modules/voting/service"
import { finalizeExpiredVotingIfNeeded } from "@/server/modules/matches/service"
import { publicVoteSchema } from "@/lib/validators"
import type { ApiResponse } from "@/types/domain.types"

export async function POST(req: NextRequest) {
  try {
    const body = publicVoteSchema.safeParse(await req.json())
    if (!body.success)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "INVALID_INPUT" }, { status: 400 })

    const { challengeId, teamId, voterToken } = body.data

    // Auto-finalize expired voting before accepting the vote
    await finalizeExpiredVotingIfNeeded(challengeId)

    await submitPublicVote(challengeId, teamId, voterToken)

    return NextResponse.json<ApiResponse<{ success: true }>>({ data: { success: true }, error: null })
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "ALREADY_VOTED") {
        return NextResponse.json<ApiResponse<null>>({ data: null, error: "ALREADY_VOTED" }, { status: 409 })
      }
      if (err.message === "VOTING_NOT_OPEN") {
        return NextResponse.json<ApiResponse<null>>({ data: null, error: "VOTING_NOT_OPEN" }, { status: 400 })
      }
      if (err.message === "INVALID_TEAM") {
        return NextResponse.json<ApiResponse<null>>({ data: null, error: "INVALID_TEAM" }, { status: 400 })
      }
      if (err.message === "VOTING_CLOSED") {
        return NextResponse.json<ApiResponse<null>>({ data: null, error: "VOTING_CLOSED" }, { status: 400 })
      }
      if (err.message === "VOTING_TEMPORARILY_UNAVAILABLE") {
        return NextResponse.json<ApiResponse<null>>({ data: null, error: "VOTING_TEMPORARILY_UNAVAILABLE" }, { status: 503 })
      }
    }
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
