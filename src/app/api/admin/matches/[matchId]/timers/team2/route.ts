import { NextRequest, NextResponse } from "next/server"
import { patchTimer } from "@/server/modules/matches/service"
import { getCurrentUser } from "@/server/modules/matches/auth-helper"
import { assertIsAdmin } from "@/server/modules/matches/policy"
import { patchTimerSchema } from "@/server/modules/matches/validator"
import type { ApiResponse } from "@/types/domain.types"

export async function PATCH(req: NextRequest, { params }: { params: { matchId: string } }) {
  try {
    const user = await getCurrentUser()
    assertIsAdmin(user)

    const body = patchTimerSchema.safeParse(await req.json())
    if (!body.success) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: body.error.message }, { status: 400 })
    }

    const result = await patchTimer(params.matchId, "TEAM2", body.data)
    return NextResponse.json<ApiResponse<typeof result>>({ data: result, error: null })
  } catch (err) {
    if (err instanceof Error && err.name === "ForbiddenError") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })
    }
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
