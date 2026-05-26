import { NextResponse } from "next/server"
import { resetAllChallenges } from "@/server/modules/matches/repository"
import { getCurrentUser } from "@/server/modules/matches/auth-helper"
import { assertIsAdmin } from "@/server/modules/matches/policy"
import type { ApiResponse } from "@/types/domain.types"

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "event-001"

export async function POST() {
  try {
    const user = await getCurrentUser()
    assertIsAdmin(user)

    const count = await resetAllChallenges(EVENT_ID)
    return NextResponse.json<ApiResponse<{ count: number }>>({ data: { count }, error: null })
  } catch (err) {
    if (err instanceof Error && err.name === "ForbiddenError") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })
    }
    console.error("[POST /api/admin/matches/reset-all]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
