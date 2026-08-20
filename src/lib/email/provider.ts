import nodemailer from "nodemailer";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export interface EmailProvider {
  send(input: SendEmailInput): Promise<void>;
}

class DevelopmentEmailProvider implements EmailProvider {
  async send(input: SendEmailInput): Promise<void> {
    logger.info("Development email (not sent)", {
      to: input.to,
      subject: input.subject,
      text: input.text ?? "[html email]",
    });
  }
}

class SmtpEmailProvider implements EmailProvider {
  async send(input: SendEmailInput): Promise<void> {
    const env = getEnv();
    if (!env.SMTP_HOST || !env.SMTP_PORT) {
      throw new Error("SMTP is not configured");
    }

    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASSWORD
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASSWORD,
            }
          : undefined,
    });

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  }
}

export function getEmailProvider(): EmailProvider {
  const { EMAIL_MODE } = getEnv();
  if (EMAIL_MODE === "smtp") {
    return new SmtpEmailProvider();
  }
  return new DevelopmentEmailProvider();
}
