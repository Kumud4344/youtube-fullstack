import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "@/lib/env";
import type { UserPlan, UserRole } from "@/constants/app";

export type SessionPayload = {
  sub: string;
  email: string;
  username: string;
  role: UserRole;
  plan: UserPlan;
};

function getSecretKey() {
  const { JWT_SECRET } = getEnv();
  return new TextEncoder().encode(JWT_SECRET);
}

function parseExpiryToSeconds(expiresIn: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiresIn.trim());
  if (!match) return 60 * 60 * 24 * 7;
  const value = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 60 * 60 * 24;
    default:
      return 60 * 60 * 24 * 7;
  }
}

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  const { JWT_EXPIRES_IN } = getEnv();
  const expiresInSeconds = parseExpiryToSeconds(JWT_EXPIRES_IN);

  return new SignJWT({
    email: payload.email,
    username: payload.username,
    role: payload.role,
    plan: payload.plan,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.plan !== "string"
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      username: payload.username,
      role: payload.role as UserRole,
      plan: payload.plan as UserPlan,
    };
  } catch {
    return null;
  }
}

export function getSessionCookieMaxAgeSeconds(): number {
  const { JWT_EXPIRES_IN } = getEnv();
  return parseExpiryToSeconds(JWT_EXPIRES_IN);
}
