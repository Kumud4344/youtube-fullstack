import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { getInvoiceForUser } from "@/services/payment.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const invoice = await withDb(() => getInvoiceForUser(id, session.sub));
    return apiSuccess({ invoice }, "Invoice fetched.");
  } catch (error) {
    return handleRouteError(error);
  }
}
