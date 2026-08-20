import { verifyOtpSchema } from "@/features/auth/schemas";
import { apiSuccess } from "@/lib/api/response";
import { handleRouteError, withDb } from "@/lib/api/route-helpers";
import { verifyAuthOtp } from "@/services/auth.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = verifyOtpSchema.parse(body);
    const result = await withDb(() => verifyAuthOtp(input));
    return apiSuccess(result, "Logged in successfully.");
  } catch (error) {
    return handleRouteError(error);
  }
}
