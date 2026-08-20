import { registerSchema } from "@/features/auth/schemas";
import { apiSuccess } from "@/lib/api/response";
import { handleRouteError, withDb } from "@/lib/api/route-helpers";
import { registerUser } from "@/services/auth.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);
    const result = await withDb(() => registerUser(input));
    return apiSuccess(result, "Registration successful. Verify OTP to continue.", {
      status: 201,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
