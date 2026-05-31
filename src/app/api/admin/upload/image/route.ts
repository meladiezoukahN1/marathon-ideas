import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { put } from "@vercel/blob"
import type { ApiResponse } from "@/types/domain.types"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_SIZE = 4 * 1024 * 1024 // 4MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "UNAUTHORIZED" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "NO_FILE" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "INVALID_TYPE" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json<ApiResponse<null>>({ data: null, error: "FILE_TOO_LARGE" }, { status: 400 })
    }

    const blob = await put(`teams/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    })

    return NextResponse.json<ApiResponse<{ url: string }>>({ data: { url: blob.url }, error: null })
  } catch (err) {
    console.error("[POST /api/admin/upload/image]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
