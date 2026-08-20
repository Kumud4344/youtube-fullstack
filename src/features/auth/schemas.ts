import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username may only contain letters, numbers, and underscores",
    ),
  email: z.string().trim().email().toLowerCase(),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\+?[0-9]{10,15}$/.test(value),
      "Enter a valid phone number",
    )
    .optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Za-z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a number"),
  city: z.string().trim().min(2).max(80).optional(),
  state: z.string().trim().min(2).max(80).optional(),
  country: z.string().trim().min(2).max(80).optional(),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(128),
});

export const verifyOtpSchema = z.object({
  challengeId: z.string().min(1),
  otp: z.string().trim().regex(/^\d{4,8}$/, "Enter a valid OTP"),
});

export const resendOtpSchema = z.object({
  challengeId: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
