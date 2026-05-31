import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/server/modules/matches/auth-helper"
import { assertIsAdmin } from "@/server/modules/matches/policy"
import { getMatchVoteAudit } from "@/server/modules/matches/repository"
import type { VoteAuditResponse } from "@/server/modules/matches/types"

export async function GET(req: NextRequest, { params }: { params: { matchId: string } }) {
  try {
    const user = await getCurrentUser()
    assertIsAdmin(user)

    const { searchParams } = req.nextUrl
    const teamId = searchParams.get("teamId") || undefined
    const voteType = (searchParams.get("voteType") as "PUBLIC" | "JURY" | "ALL" | null) || undefined
    const search = searchParams.get("search") || undefined
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "25", 10) || 25))

    const result = await getMatchVoteAudit(params.matchId, { teamId, voteType, search, page, pageSize })
    return NextResponse.json<VoteAuditResponse>(result)
  } catch (err) {
    if (err instanceof Error && err.name === "ForbiddenError") {
      return NextResponse.json({ data: null, error: "UNAUTHORIZED" }, { status: 401 })
    }
    console.error("[GET /api/admin/matches/:matchId/votes]", err)
    return NextResponse.json({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
