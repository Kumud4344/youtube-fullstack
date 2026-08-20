import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/constants/app";
import {
  createSessionToken,
  getSessionCookieMaxAgeSeconds,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/auth/jwt";
import { getEnv } from "@/lib/env";

export async function setAuthCookie(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  const { NODE_ENV } = getEnv();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getSessionCookieMaxAgeSeconds(),
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
