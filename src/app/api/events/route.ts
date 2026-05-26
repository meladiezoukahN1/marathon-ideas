import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { ApiResponse } from "@/types/domain.types"

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true, description: true, status: true },
    })
    return NextResponse.json<ApiResponse<typeof events>>({ data: events, error: null })
  } catch (err) {
    console.error("[GET /api/events]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
