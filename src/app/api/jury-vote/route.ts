import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { submitJuryVote } from "@/server/modules/voting/service"
import { finalizeExpiredVotingIfNeeded } from "@/server/modules/matches/service"
import { juryVoteSchema } from "@/lib/validators"
import type { ApiResponse } from "@/types/domain.types"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "JURY")
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })

    const body = juryVoteSchema.safeParse(await req.json())
    if (!body.success)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "INVALID_INPUT" }, { status: 400 })

    const { challengeId, teamId } = body.data

    // Auto-finalize expired voting before accepting the vote
    await finalizeExpiredVotingIfNeeded(challengeId)

    await submitJuryVote(challengeId, teamId, session.user.id)

    return NextResponse.json<ApiResponse<{ success: true }>>({ data: { success: true }, error: null })
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "ALREADY_VOTED" || (err instanceof Error && err.message.includes("P2002"))) {
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
