import { describe, expect, it } from "vitest";
import { assertWatchProgressAllowed } from "@/services/watch-entitlement.service";
import { isAppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/constants/errors";
import { MockPaymentGatewayHelper } from "./payment-test-helpers";

describe("watch limits", () => {
  it("enforces free 5-minute limit", () => {
    try {
      assertWatchProgressAllowed({
        plan: "FREE",
        requestedPosition: 301,
        requestedWatchedSeconds: 301,
        previousWatchedSeconds: 290,
      });
      throw new Error("expected limit error");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe(ERROR_CODES.WATCH_LIMIT_REACHED);
        expect((error.details as { watchLimitSeconds: number }).watchLimitSeconds).toBe(
          300,
        );
      }
    }
  });

  it("allows bronze up to 7 minutes", () => {
    const result = assertWatchProgressAllowed({
      plan: "BRONZE",
      requestedPosition: 400,
      requestedWatchedSeconds: 400,
      previousWatchedSeconds: 100,
    });
    expect(result.limitReached).toBe(false);
    expect(result.watchedSeconds).toBe(400);
  });

  it("allows unlimited gold", () => {
    const result = assertWatchProgressAllowed({
      plan: "GOLD",
      requestedPosition: 10_000,
      requestedWatchedSeconds: 10_000,
      previousWatchedSeconds: 0,
    });
    expect(result.limitReached).toBe(false);
    expect(result.watchLimitSeconds).toBeNull();
  });
});

describe("payment signature verification", () => {
  it("accepts mock signatures and rejects invalid ones", () => {
    const gateway = new MockPaymentGatewayHelper();
    expect(
      gateway.verifyPaymentSignature({
        orderId: "order_1",
        paymentId: "pay_1",
        signature: "mock_order_1_pay_1",
      }),
    ).toBe(true);
    expect(
      gateway.verifyPaymentSignature({
        orderId: "order_1",
        paymentId: "pay_1",
        signature: "tampered",
      }),
    ).toBe(false);
  });
});
