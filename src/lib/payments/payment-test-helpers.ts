/**
 * Thin helper so tests don't import Razorpay Node SDK setup.
 * Mirrors MockPaymentGateway signature rules.
 */
export class MockPaymentGatewayHelper {
  verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    return params.signature === `mock_${params.orderId}_${params.paymentId}`;
  }
}
