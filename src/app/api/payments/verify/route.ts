import { verifyPaymentSchema } from "@/features/payments/schemas";
import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { verifyAndActivatePayment } from "@/services/payment.service";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = verifyPaymentSchema.parse(await request.json());
    const result = await withDb(() =>
      verifyAndActivatePayment({
        userId: session.sub,
        razorpayOrderId: body.razorpayOrderId,
        razorpayPaymentId: body.razorpayPaymentId,
        razorpaySignature: body.razorpaySignature,
      }),
    );
    return apiSuccess(result, "Payment verified and plan activated.");
  } catch (error) {
    return handleRouteError(error);
  }
}
