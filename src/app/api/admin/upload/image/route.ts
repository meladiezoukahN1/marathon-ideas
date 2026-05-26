import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile } from "fs/promises"
import { mkdir } from "fs/promises"
import { join } from "path"
import crypto from "crypto"
import type { ApiResponse } from "@/types/domain.types"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

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

    const ext = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp"
    const hash = crypto.randomBytes(8).toString("hex")
    const filename = `${hash}.${ext}`
    const uploadDir = join(process.cwd(), "public", "uploads", "teams")
    const filepath = join(uploadDir, filename)

    await mkdir(uploadDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    const url = `/uploads/teams/${filename}`

    return NextResponse.json<ApiResponse<{ url: string }>>({ data: { url }, error: null })
  } catch (err) {
    console.error("[POST /api/admin/upload/image]", err)
    return NextResponse.json<ApiResponse<null>>({ data: null, error: "SERVER_ERROR" }, { status: 500 })
  }
}
