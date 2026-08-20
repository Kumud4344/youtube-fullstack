import { logger } from "@/lib/logger";

export type SendSmsInput = {
  to: string;
  message: string;
};

export interface SmsProvider {
  send(input: SendSmsInput): Promise<void>;
}

class MockSmsProvider implements SmsProvider {
  async send(input: SendSmsInput): Promise<void> {
    logger.info("Mock SMS (not sent)", {
      to: input.to,
      message: "[REDACTED_OTP_MESSAGE]",
      previewLength: input.message.length,
    });
  }
}

class LiveSmsProvider implements SmsProvider {
  async send(input: SendSmsInput): Promise<void> {
    // Production: integrate SMS gateway with SMS_API_KEY / SMS_API_URL.
    logger.warn("Live SMS provider not fully configured; falling back to log", {
      to: input.to,
    });
    await new MockSmsProvider().send(input);
  }
}

export function getSmsProvider(): SmsProvider {
  const mode = process.env.SMS_MODE ?? "mock";
  if (mode === "live") {
    return new LiveSmsProvider();
  }
  return new MockSmsProvider();
}
