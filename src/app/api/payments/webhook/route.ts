import { apiSuccess, apiError } from "@/lib/api/response";
import { handleRouteError, withDb } from "@/lib/api/route-helpers";
import { ERROR_CODES } from "@/constants/errors";
import { getPaymentGateway } from "@/lib/payments/gateway";
import { finalizeSuccessfulPayment } from "@/services/payment.service";
import { logger } from "@/lib/logger";
import { Payment } from "@/models/Payment";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") ?? "";
    const gateway = getPaymentGateway();

    if (!gateway.verifyWebhookSignature(rawBody, signature)) {
      logger.warn("Invalid Razorpay webhook signature");
      return apiError(
        ERROR_CODES.PAYMENT_VERIFICATION_FAILED,
        "Invalid webhook signature.",
        400,
      );
    }

    const payload = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            status?: string;
          };
        };
      };
    };

    if (payload.event === "payment.captured") {
      const entity = payload.payload?.payment?.entity;
      if (entity?.id && entity.order_id) {
        await withDb(() =>
          finalizeSuccessfulPayment({
            razorpayOrderId: entity.order_id!,
            razorpayPaymentId: entity.id!,
          }),
        );
      }
    }

    if (payload.event === "payment.failed") {
      const entity = payload.payload?.payment?.entity;
      if (entity?.order_id) {
        await withDb(async () => {
          await Payment.findOneAndUpdate(
            { razorpayOrderId: entity.order_id, status: "created" },
            { $set: { status: "failed" } },
          );
        });
      }
    }

    return apiSuccess({ received: true }, "Webhook processed.");
  } catch (error) {
    return handleRouteError(error);
  }
}
