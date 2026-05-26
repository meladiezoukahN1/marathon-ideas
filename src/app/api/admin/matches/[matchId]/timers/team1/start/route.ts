import { NextResponse } from "next/server"
import { startTimer } from "@/server/modules/matches/service"
import { getCurrentUser } from "@/server/modules/matches/auth-helper"
import { assertIsAdmin } from "@/server/modules/matches/policy"
import type { ApiResponse } from "@/types/domain.types"

export async function POST(_req: Request, { params }: { params: { matchId: string } }) {
  try {
    const user = await getCurrentUser()
    assertIsAdmin(user)

    const result = await startTimer(params.matchId, "TEAM1")
    return NextResponse.json<ApiResponse<typeof result>>({ data: result, error: null })
  } catch (err) {
    if (err instanceof Error && err.name === "ForbiddenError") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })
    }
    if (err instanceof Error && err.message === "TIMER_FINISHED_MUST_RESET") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "TIMER_FINISHED_MUST_RESET" }, { status: 400 })
    }
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
