import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { listPayments } from "@/services/payment.service";

export async function GET() {
  try {
    const session = await requireSession();
    const items = await withDb(() => listPayments(session.sub));
    return apiSuccess({ items }, "Payments fetched.");
  } catch (error) {
    return handleRouteError(error);
  }
}
