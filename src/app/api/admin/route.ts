import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminActionSchema } from "@/lib/validators"
import { setPhase, controlTimer, revealResult } from "@/lib/actions/challenge.actions"
import { emitToChallenge } from "@/lib/socket"
import type { ApiResponse } from "@/types/domain.types"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN", "SUPERADMIN"].includes(session.user.role))
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })

    const body = adminActionSchema.safeParse(await req.json())
    if (!body.success)
      return NextResponse.json<ApiResponse<null>>({ data: null, error: body.error.message }, { status: 400 })

    const payload = body.data

    if (payload.action === "setPhase") {
      await setPhase(payload.challengeId, payload.phase)
    } else if (payload.action === "timerControl") {
      const result = await controlTimer(payload.challengeId, payload.timerAction, payload.delta)
      emitToChallenge(payload.challengeId, "challenge:update", {
        challengeId: payload.challengeId,
        phase: "PRESENTING",
        ...result,
      })
    } else if (payload.action === "revealResult") {
      await revealResult(payload.challengeId)
    }

    return NextResponse.json<ApiResponse<{ success: true }>>({ data: { success: true }, error: null })
  } catch (err) {
    console.error("[POST /api/admin]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
