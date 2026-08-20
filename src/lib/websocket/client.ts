"use client";

import { io, type Socket } from "socket.io-client";
import { apiFetch } from "@/lib/api/client";

type SocketTokenResponse = {
  token: string;
  socketUrl: string;
};

let socketSingleton: Socket | null = null;
let connecting: Promise<Socket> | null = null;

export async function getSignalingSocket(): Promise<Socket> {
  if (socketSingleton?.connected) return socketSingleton;
  if (connecting) return connecting;

  connecting = (async () => {
    const data = await apiFetch<SocketTokenResponse>(
      "/api/calls/socket-token",
      { method: "POST" },
    );

    if (socketSingleton) {
      socketSingleton.auth = { token: data.token };
      socketSingleton.connect();
      return socketSingleton;
    }

    const socket = io(data.socketUrl, {
      auth: { token: data.token },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketSingleton = socket;
    return socket;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
}

export function disconnectSignalingSocket() {
  socketSingleton?.disconnect();
  socketSingleton = null;
}
