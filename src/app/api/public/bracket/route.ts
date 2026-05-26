import { NextResponse } from "next/server"
import { getAllMatchesWithResults } from "@/server/modules/matches/repository"
import type { ApiResponse } from "@/types/domain.types"

export const dynamic = "force-dynamic"

const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "event-001"

export async function GET() {
  try {
    const matches = await getAllMatchesWithResults(EVENT_ID)
    return NextResponse.json<ApiResponse<typeof matches>>({ data: matches, error: null })
  } catch {
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
