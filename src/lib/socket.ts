import type { Server } from "socket.io"
import type { ServerToClientEvents, ClientToServerEvents } from "@/types/socket.types"

type IOServer = Server<ClientToServerEvents, ServerToClientEvents>

const globalForIO = globalThis as unknown as { __io?: IOServer }

export function getIO(): IOServer {
  if (!globalForIO.__io) {
    throw new Error("Socket.IO server not initialized")
  }
  return globalForIO.__io
}

export function setIO(io: IOServer): void {
  globalForIO.__io = io
}

export function emitToChallenge<E extends keyof ServerToClientEvents>(
  challengeId: string,
  event: E,
  data: Parameters<ServerToClientEvents[E]>[0],
): void {
  try {
    const io = getIO()
    io.to(`challenge:${challengeId}`).emit(event, ...[data] as Parameters<ServerToClientEvents[E]>)
  } catch {
    // Socket not initialized (e.g. during tests) — silent
  }
}
