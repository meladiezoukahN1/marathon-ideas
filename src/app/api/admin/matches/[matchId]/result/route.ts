import { NextResponse } from "next/server"
import { calculateAndStoreResult, getMatchVoteCounts } from "@/server/modules/matches/service"
import { getCurrentUser } from "@/server/modules/matches/auth-helper"
import { assertIsAdmin } from "@/server/modules/matches/policy"
import type { ApiResponse } from "@/types/domain.types"

export async function POST(_req: Request, { params }: { params: { matchId: string } }) {
  try {
    const user = await getCurrentUser()
    assertIsAdmin(user)

    const result = await calculateAndStoreResult(params.matchId)
    return NextResponse.json<ApiResponse<typeof result>>({ data: result, error: null })
  } catch (err) {
    if (err instanceof Error && err.name === "ForbiddenError") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })
    }
    if (err instanceof Error && err.message === "MATCH_NOT_FOUND") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "MATCH_NOT_FOUND" }, { status: 404 })
    }
    if (err instanceof Error && err.message === "RESULT_NOT_READY") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "RESULT_NOT_READY" }, { status: 400 })
    }
    if (err instanceof Error && err.message === "VOTING_STILL_OPEN") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "VOTING_STILL_OPEN" }, { status: 409 })
    }
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}

export async function GET(_req: Request, { params }: { params: { matchId: string } }) {
  try {
    const user = await getCurrentUser()
    assertIsAdmin(user)

    const counts = await getMatchVoteCounts(params.matchId)
    return NextResponse.json<ApiResponse<typeof counts>>({ data: counts, error: null })
  } catch (err) {
    if (err instanceof Error && err.name === "ForbiddenError") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })
    }
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
