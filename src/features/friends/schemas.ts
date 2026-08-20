import { z } from "zod";

export const sendFriendRequestSchema = z.object({
  username: z.string().trim().min(3).max(30),
});

export const respondFriendRequestSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

export const createCallSchema = z.object({
  receiverId: z.string().min(1),
});

export const updateCallStatusSchema = z.object({
  status: z.enum([
    "calling",
    "ringing",
    "connected",
    "reconnecting",
    "ended",
    "failed",
  ]),
});
