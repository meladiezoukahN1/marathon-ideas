import { NextRequest, NextResponse } from "next/server"
import { activateMatch } from "@/server/modules/matches/service"
import { getCurrentUser } from "@/server/modules/matches/auth-helper"
import { assertIsAdmin } from "@/server/modules/matches/policy"
import type { ApiResponse } from "@/types/domain.types"

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "event-001"

export async function POST(_req: NextRequest, { params }: { params: { matchId: string } }) {
  try {
    const user = await getCurrentUser()
    assertIsAdmin(user)

    const { matchId } = params
    const result = await activateMatch(EVENT_ID, matchId)
    return NextResponse.json<ApiResponse<typeof result>>({ data: result, error: null })
  } catch (err) {
    if (err instanceof Error && err.name === "ForbiddenError") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })
    }
    if (err instanceof Error && err.message === "MATCH_NOT_FOUND") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "MATCH_NOT_FOUND" }, { status: 404 })
    }
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
