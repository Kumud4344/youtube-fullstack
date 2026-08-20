import { forgotPasswordSchema } from "@/features/auth/schemas";
import { apiSuccess } from "@/lib/api/response";
import { handleRouteError, withDb } from "@/lib/api/route-helpers";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { User } from "@/models/User";
import { createAndSendOtp } from "@/services/otp.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = forgotPasswordSchema.parse(body);

    const result = await withDb(async () => {
      assertRateLimit(`forgot:${input.email}`, 3, 60_000);
      const user = await User.findOne({ email: input.email });

      // Always return a generic success to avoid account enumeration.
      if (!user) {
        return {
          accepted: true,
          exists: false,
        };
      }

      const otp = await createAndSendOtp({
        userId: user._id,
        purpose: "RESET_PASSWORD",
        state: user.state,
        email: user.email,
        phone: user.phone,
        forceChannel: "EMAIL",
      });

      return {
        accepted: true,
        exists: true,
        challengeId: otp.challengeId,
        channel: otp.channel,
        destinationHint: otp.destinationHint,
        debugOtp: otp.debugOtp,
      };
    });

    return apiSuccess(
      result,
      "If an account exists, a reset code has been sent.",
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
