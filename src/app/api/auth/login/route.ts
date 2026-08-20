import { loginSchema } from "@/features/auth/schemas";
import { apiSuccess } from "@/lib/api/response";
import { handleRouteError, withDb } from "@/lib/api/route-helpers";
import { loginWithPassword } from "@/services/auth.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = loginSchema.parse(body);
    const result = await withDb(() => loginWithPassword(input));
    return apiSuccess(
      result,
      "Credentials verified. Enter the OTP sent to continue.",
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
