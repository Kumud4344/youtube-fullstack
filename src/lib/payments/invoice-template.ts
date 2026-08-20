import { getPlanConfig } from "@/constants/plans";
import type { UserPlan } from "@/constants/app";

export function buildInvoiceHtml(params: {
  invoiceNumber: string;
  userName: string;
  planName: string;
  amountDisplay: string;
  paymentId: string;
  orderId: string;
  transactionDate: string;
  startedAt: string;
  expiresAt: string;
}): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;color:#e2e8f0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border:1px solid #1f2937;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 12px 28px;">
                <div style="font-size:22px;font-weight:700;color:#67e8f9;">Vidora</div>
                <div style="margin-top:8px;font-size:18px;font-weight:600;color:#fff;">Payment Invoice</div>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 28px 28px 28px;">
                <p style="margin:0 0 12px 0;color:#94a3b8;">Hi ${params.userName},</p>
                <p style="margin:0 0 20px 0;color:#cbd5e1;">Thanks for upgrading. Your subscription is active.</p>
                <table width="100%" style="border-collapse:collapse;">
                  <tr><td style="padding:8px 0;color:#94a3b8;">Invoice</td><td style="padding:8px 0;text-align:right;color:#fff;">${params.invoiceNumber}</td></tr>
                  <tr><td style="padding:8px 0;color:#94a3b8;">Plan</td><td style="padding:8px 0;text-align:right;color:#67e8f9;">${params.planName}</td></tr>
                  <tr><td style="padding:8px 0;color:#94a3b8;">Amount</td><td style="padding:8px 0;text-align:right;color:#fff;">${params.amountDisplay}</td></tr>
                  <tr><td style="padding:8px 0;color:#94a3b8;">Payment ID</td><td style="padding:8px 0;text-align:right;color:#fff;">${params.paymentId}</td></tr>
                  <tr><td style="padding:8px 0;color:#94a3b8;">Order ID</td><td style="padding:8px 0;text-align:right;color:#fff;">${params.orderId}</td></tr>
                  <tr><td style="padding:8px 0;color:#94a3b8;">Date</td><td style="padding:8px 0;text-align:right;color:#fff;">${params.transactionDate}</td></tr>
                  <tr><td style="padding:8px 0;color:#94a3b8;">Valid</td><td style="padding:8px 0;text-align:right;color:#fff;">${params.startedAt} → ${params.expiresAt}</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function formatInrFromPaise(paise: number): string {
  return `₹${(paise / 100).toFixed(paise % 100 === 0 ? 0 : 2)}`;
}

export function planDisplayName(plan: UserPlan): string {
  return getPlanConfig(plan).name;
}
