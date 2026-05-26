"use client"
import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import type { ServerToClientEvents, ClientToServerEvents } from "@/types/socket.types"

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>
let _socket: AppSocket | null = null

export function useSocket() {
  const [connected, setConnected] = useState(false)
  const ref = useRef<AppSocket | null>(null)

  useEffect(() => {
    if (!_socket) {
      _socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "", {
        transports: ["websocket"],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      })
    }
    ref.current = _socket
    const onConnect    = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    _socket.on("connect",    onConnect)
    _socket.on("disconnect", onDisconnect)
    if (_socket.connected) setConnected(true)
    return () => {
      _socket?.off("connect",    onConnect)
      _socket?.off("disconnect", onDisconnect)
    }
  }, [])

  return { socket: ref.current, connected }
}
