import { resendOtpSchema } from "@/features/auth/schemas";
import { ERROR_CODES } from "@/constants/errors";
import { apiSuccess } from "@/lib/api/response";
import { handleRouteError, withDb } from "@/lib/api/route-helpers";
import { AppError } from "@/lib/errors/app-error";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { OTPVerification } from "@/models/OTPVerification";
import { User } from "@/models/User";
import { createAndSendOtp } from "@/services/otp.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = resendOtpSchema.parse(body);

    const result = await withDb(async () => {
      assertRateLimit(`otp-resend:${input.challengeId}`, 3, 60_000);

      const previous = await OTPVerification.findById(input.challengeId);
      if (!previous) {
        throw new AppError(ERROR_CODES.OTP_INVALID, "Invalid OTP challenge.", 400);
      }

      const user = await User.findById(previous.userId);
      if (!user) {
        throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found.", 404);
      }

      previous.consumedAt = new Date();
      await previous.save();

      return createAndSendOtp({
        userId: user._id,
        purpose: previous.purpose as
          | "LOGIN"
          | "REGISTER"
          | "RESET_PASSWORD"
          | "VERIFY_CONTACT",
        state: user.state,
        email: user.email,
        phone: user.phone,
        forceChannel: previous.channel as "EMAIL" | "MOBILE",
      });
    });

    return apiSuccess(result, "A new OTP has been sent.");
  } catch (error) {
    return handleRouteError(error);
  }
}
