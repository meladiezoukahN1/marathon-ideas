import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createAdminUser, getUsersForAdmin } from "@/server/modules/users/management/service"
import { createUserSchema, userListQuerySchema } from "@/server/modules/users/management/validator"
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

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ data: null, error: "UNAUTHORIZED" }, { status: 401 })
    }

    const parsed = userListQuerySchema.safeParse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 })
    }

    const result = await getUsersForAdmin(currentUser, parsed.data)
    return NextResponse.json({ data: result.data, pagination: result.pagination, error: null })
  } catch (error) {
    return mapError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ data: null, error: "UNAUTHORIZED" }, { status: 401 })
    }

    const parsed = createUserSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 })
    }

    const result = await createAdminUser(currentUser, parsed.data)
    return NextResponse.json({ data: result, error: null }, { status: 201 })
  } catch (error) {
    return mapError(error)
  }
}