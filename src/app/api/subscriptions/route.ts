import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { getActivePlanSubscription } from "@/services/payment.service";

export async function GET() {
  try {
    const session = await requireSession();
    const data = await withDb(() => getActivePlanSubscription(session.sub));
    return apiSuccess(data, "Subscription fetched.");
  } catch (error) {
    return handleRouteError(error);
  }
}
