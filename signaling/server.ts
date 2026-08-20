import { createServer } from "http";
import { Server } from "socket.io";
import { jwtVerify } from "jose";

type SocketUser = {
  id: string;
  username: string;
  name: string;
};

const PORT = Number(process.env.SOCKET_PORT ?? 3001);
const JWT_SECRET = process.env.JWT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

if (!JWT_SECRET) {
  console.error("JWT_SECRET is required for the signaling server");
  process.exit(1);
}

const onlineUsers = new Map<string, { socketId: string; user: SocketUser }>();

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true, service: "vidora-signaling" }));
});

const io = new Server(httpServer, {
  cors: {
    origin: APP_URL,
    credentials: true,
  },
});

async function authenticate(token: string): Promise<SocketUser | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET),
    );
    if (
      payload.purpose !== "socket" ||
      typeof payload.sub !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }
    return {
      id: payload.sub,
      username: payload.username,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

function broadcastPresence() {
  const online = [...onlineUsers.values()].map((entry) => ({
    id: entry.user.id,
    username: entry.user.username,
    name: entry.user.name,
  }));
  io.emit("presence:update", { online });
}

io.use(async (socket, next) => {
  const token =
    typeof socket.handshake.auth?.token === "string"
      ? socket.handshake.auth.token
      : typeof socket.handshake.query?.token === "string"
        ? socket.handshake.query.token
        : null;

  if (!token) {
    next(new Error("Unauthorized"));
    return;
  }

  const user = await authenticate(token);
  if (!user) {
    next(new Error("Unauthorized"));
    return;
  }

  socket.data.user = user;
  next();
});

io.on("connection", (socket) => {
  const user = socket.data.user as SocketUser;
  onlineUsers.set(user.id, { socketId: socket.id, user });
  socket.join(`user:${user.id}`);
  broadcastPresence();

  socket.on("call:invite", (payload: {
    callId: string;
    receiverId: string;
  }) => {
    io.to(`user:${payload.receiverId}`).emit("call:invite", {
      callId: payload.callId,
      caller: user,
    });
    socket.emit("call:ringing", { callId: payload.callId });
  });

  socket.on("call:accept", (payload: { callId: string; callerId: string }) => {
    io.to(`user:${payload.callerId}`).emit("call:accept", {
      callId: payload.callId,
      receiver: user,
    });
  });

  socket.on("call:reject", (payload: { callId: string; callerId: string }) => {
    io.to(`user:${payload.callerId}`).emit("call:reject", {
      callId: payload.callId,
      receiver: user,
    });
  });

  socket.on("call:end", (payload: { callId: string; peerId: string }) => {
    io.to(`user:${payload.peerId}`).emit("call:end", {
      callId: payload.callId,
      from: user,
    });
  });

  socket.on(
    "webrtc:ready",
    (payload: { peerId: string; callId: string }) => {
      io.to(`user:${payload.peerId}`).emit("webrtc:ready", {
        callId: payload.callId,
        from: user,
      });
    },
  );

  socket.on(
    "webrtc:offer",
    (payload: {
      peerId: string;
      callId: string;
      sdp: { type?: string; sdp?: string };
    }) => {
      io.to(`user:${payload.peerId}`).emit("webrtc:offer", {
        callId: payload.callId,
        from: user,
        sdp: payload.sdp,
      });
    },
  );

  socket.on(
    "webrtc:answer",
    (payload: {
      peerId: string;
      callId: string;
      sdp: { type?: string; sdp?: string };
    }) => {
      io.to(`user:${payload.peerId}`).emit("webrtc:answer", {
        callId: payload.callId,
        from: user,
        sdp: payload.sdp,
      });
    },
  );

  socket.on(
    "webrtc:ice",
    (payload: {
      peerId: string;
      callId: string;
      candidate: Record<string, unknown>;
    }) => {
      io.to(`user:${payload.peerId}`).emit("webrtc:ice", {
        callId: payload.callId,
        from: user,
        candidate: payload.candidate,
      });
    },
  );

  socket.on("disconnect", () => {
    const current = onlineUsers.get(user.id);
    if (current?.socketId === socket.id) {
      onlineUsers.delete(user.id);
      broadcastPresence();
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Vidora signaling] listening on :${PORT}`);
});
