import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  APP_TIMEZONE: z.string().default("Asia/Kolkata"),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  AUTH_COOKIE_NAME: z.string().default("vidora_session"),
  OTP_EXPIRES_MINUTES: z.coerce.number().positive().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().positive().default(5),
  OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(6),
  EMAIL_MODE: z.enum(["development", "smtp"]).default("development"),
  SMS_MODE: z.enum(["mock", "live"]).default("mock"),
  LOCATION_MODE: z.enum(["mock", "ip"]).default("mock"),
  MOCK_LOCATION_CITY: z.string().default("Bengaluru"),
  MOCK_LOCATION_STATE: z.string().default("Karnataka"),
  MOCK_LOCATION_COUNTRY: z.string().default("India"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default("Vidora <noreply@vidora.local>"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(60),
  LOGIN_MAX_ATTEMPTS: z.coerce.number().default(5),
  LOGIN_LOCKOUT_MINUTES: z.coerce.number().default(15),
  VIDEO_STORAGE_DRIVER: z.enum(["local", "s3", "r2"]).default("local"),
  PAYMENT_MODE: z.enum(["test", "live"]).default("test"),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    APP_TIMEZONE: process.env.APP_TIMEZONE,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME,
    OTP_EXPIRES_MINUTES: process.env.OTP_EXPIRES_MINUTES,
    OTP_MAX_ATTEMPTS: process.env.OTP_MAX_ATTEMPTS,
    OTP_LENGTH: process.env.OTP_LENGTH,
    EMAIL_MODE: process.env.EMAIL_MODE,
    SMS_MODE: process.env.SMS_MODE,
    LOCATION_MODE: process.env.LOCATION_MODE,
    MOCK_LOCATION_CITY: process.env.MOCK_LOCATION_CITY,
    MOCK_LOCATION_STATE: process.env.MOCK_LOCATION_STATE,
    MOCK_LOCATION_COUNTRY: process.env.MOCK_LOCATION_COUNTRY,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM: process.env.SMTP_FROM,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
    LOGIN_MAX_ATTEMPTS: process.env.LOGIN_MAX_ATTEMPTS,
    LOGIN_LOCKOUT_MINUTES: process.env.LOGIN_LOCKOUT_MINUTES,
    VIDEO_STORAGE_DRIVER: process.env.VIDEO_STORAGE_DRIVER,
    PAYMENT_MODE: process.env.PAYMENT_MODE,
  });

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${message}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
