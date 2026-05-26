import { NextResponse } from "next/server"
import { changePhase } from "@/server/modules/matches/service"
import { getCurrentUser } from "@/server/modules/matches/auth-helper"
import { assertIsAdmin } from "@/server/modules/matches/policy"
import { changePhaseSchema } from "@/server/modules/matches/validator"
import type { ApiResponse } from "@/types/domain.types"

export async function POST(req: Request, { params }: { params: { matchId: string } }) {
  try {
    const user = await getCurrentUser()
    assertIsAdmin(user)

    const body = changePhaseSchema.safeParse(await req.json())
    if (!body.success) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: body.error.message }, { status: 400 })
    }

    const result = await changePhase(params.matchId, body.data.phase, body.data.votingDurationSeconds)
    return NextResponse.json<ApiResponse<typeof result>>({ data: result, error: null })
  } catch (err) {
    if (err instanceof Error && err.name === "ForbiddenError") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })
    }
    if (err instanceof Error && err.name === "WorkflowError") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: err.message }, { status: 409 })
    }
    if (err instanceof Error && err.message === "MATCH_NOT_FOUND") {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "MATCH_NOT_FOUND" }, { status: 404 })
    }
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
