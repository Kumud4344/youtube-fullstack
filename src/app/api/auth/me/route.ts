import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { getCurrentUser } from "@/services/auth.service";

export async function GET() {
  try {
    const session = await requireSession();
    const user = await withDb(() => getCurrentUser(session.sub));
    return apiSuccess({ user }, "Session valid.");
  } catch (error) {
    return handleRouteError(error);
  }
}
