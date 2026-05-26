import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { CurrentUser } from "@/server/modules/matches/types"

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.role) return null
  return {
    id: session.user.id as string,
    role: session.user.role as CurrentUser["role"],
  }
}
