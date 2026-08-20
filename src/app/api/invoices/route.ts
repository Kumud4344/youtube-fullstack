import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { listInvoices } from "@/services/payment.service";

export async function GET() {
  try {
    const session = await requireSession();
    const items = await withDb(() => listInvoices(session.sub));
    return apiSuccess({ items }, "Invoices fetched.");
  } catch (error) {
    return handleRouteError(error);
  }
}
