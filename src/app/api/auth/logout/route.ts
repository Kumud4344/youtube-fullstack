import { apiSuccess } from "@/lib/api/response";
import { handleRouteError } from "@/lib/api/route-helpers";
import { logoutUser } from "@/services/auth.service";

export async function POST() {
  try {
    await logoutUser();
    return apiSuccess({ ok: true }, "Logged out successfully.");
  } catch (error) {
    return handleRouteError(error);
  }
}
