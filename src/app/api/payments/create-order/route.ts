import { createOrderSchema } from "@/features/payments/schemas";
import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { createUpgradeOrder } from "@/services/payment.service";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = createOrderSchema.parse(await request.json());
    const order = await withDb(() =>
      createUpgradeOrder({ userId: session.sub, plan: body.plan }),
    );
    return apiSuccess(order, "Order created.", { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
