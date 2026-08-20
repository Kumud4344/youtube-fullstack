import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "@/lib/env";

export type SocketAuthPayload = {
  sub: string;
  username: string;
  name: string;
};

function getSecretKey() {
  return new TextEncoder().encode(getEnv().JWT_SECRET);
}

export async function createSocketToken(
  payload: SocketAuthPayload,
): Promise<string> {
  return new SignJWT({
    username: payload.username,
    name: payload.name,
    purpose: "socket",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(getSecretKey());
}

export async function verifySocketToken(
  token: string,
): Promise<SocketAuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      payload.purpose !== "socket" ||
      typeof payload.sub !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      username: payload.username,
      name: payload.name,
    };
  } catch {
    return null;
  }
}
