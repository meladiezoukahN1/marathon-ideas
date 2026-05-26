import { NextResponse } from "next/server"
import { getMatchesForAdmin, deleteAllChallenges } from "@/server/modules/matches/repository"
import { finalizeExpiredVotingIfNeeded } from "@/server/modules/matches/service"
import { getCurrentUser } from "@/server/modules/matches/auth-helper"
import { assertIsAdmin } from "@/server/modules/matches/policy"

export const dynamic = "force-dynamic"
import type { ApiResponse } from "@/types/domain.types"

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "event-001"

export async function GET() {
  try {
    const user = await getCurrentUser()
    assertIsAdmin(user)

    // Auto-finalize any expired voting challenges before returning data
    const matches = await getMatchesForAdmin(EVENT_ID)
    await Promise.all(matches.map(m => m.phase === "VOTING" ? finalizeExpiredVotingIfNeeded(m.id) : Promise.resolve()))

    return NextResponse.json<ApiResponse<typeof matches>>({ data: matches, error: null })
  } catch (err) {
    if (err instanceof Error && err.name === "ForbiddenError") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })
    }
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser()
    assertIsAdmin(user)

    const count = await deleteAllChallenges(EVENT_ID)
    return NextResponse.json<ApiResponse<{ count: number }>>({ data: { count }, error: null })
  } catch (err) {
    if (err instanceof Error && err.name === "ForbiddenError") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })
    }
    console.error("[DELETE /api/admin/matches]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
