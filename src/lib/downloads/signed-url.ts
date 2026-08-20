import { createHmac, timingSafeEqual } from "crypto";
import { getEnv } from "@/lib/env";

export type DownloadTokenPayload = {
  downloadId: string;
  userId: string;
  videoId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  exp: number;
};

function secret() {
  return getEnv().JWT_SECRET;
}

export function createDownloadToken(
  payload: Omit<DownloadTokenPayload, "exp">,
  ttlSeconds = 120,
): string {
  const body: DownloadTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  const signature = createHmac("sha256", secret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyDownloadToken(token: string): DownloadTokenPayload {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    throw new Error("Invalid token");
  }

  const expected = createHmac("sha256", secret())
    .update(encoded)
    .digest("base64url");

  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(
    Buffer.from(encoded, "base64url").toString("utf8"),
  ) as DownloadTokenPayload;

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return payload;
}
