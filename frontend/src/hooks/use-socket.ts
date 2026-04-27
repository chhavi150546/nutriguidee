/**
 * src/hooks/use-socket.ts
 *
 * Socket.io client hook (L45-48: Full-duplex communication).
 *
 * Replaces Supabase Realtime channels with Socket.io events.
 * The backend at /utils/socket.js handles all events.
 */

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { getToken } from "@/lib/api";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

let sharedSocket: Socket | null = null;

export function useSocket(): Socket | null {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!sharedSocket) {
      sharedSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
      });
    }
    socketRef.current = sharedSocket;

    return () => {
      // Don't disconnect on unmount — socket is shared across pages
    };
  }, []);

  return socketRef.current;
}

/** Disconnect when the user logs out */
export function disconnectSocket() {
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }
}
