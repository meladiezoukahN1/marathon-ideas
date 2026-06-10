import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { patchAdminUser } from "@/server/modules/users/management/service"
import { updateUserSchema } from "@/server/modules/users/management/validator"
import { ConflictError, ForbiddenError, NotFoundError } from "@/server/modules/users/management/policy"
import type { CurrentUser } from "@/server/modules/users/management/types"

async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.role) return null
  return {
    id: session.user.id,
    role: session.user.role as CurrentUser["role"],
  }
}

function mapError(error: unknown) {
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ data: null, error: error.message }, { status: error.message === "Authentication required" ? 401 : 403 })
  }
  if (error instanceof ConflictError) {
    return NextResponse.json({ data: null, error: error.message }, { status: 409 })
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ data: null, error: error.message }, { status: 404 })
  }
  return NextResponse.json({ data: null, error: "SERVER_ERROR" }, { status: 500 })
}

export async function PATCH(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ data: null, error: "UNAUTHORIZED" }, { status: 401 })
    }

    const parsed = updateUserSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 })
    }

    const result = await patchAdminUser(currentUser, params.userId, parsed.data)
    return NextResponse.json({ data: result, error: null })
  } catch (error) {
    return mapError(error)
  }
}

