import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { getDownloadEntitlement } from "@/services/download.service";

export async function GET() {
  try {
    const session = await requireSession();
    const entitlement = await withDb(() => getDownloadEntitlement(session.sub));
    return apiSuccess({ entitlement }, "Download entitlement fetched.");
  } catch (error) {
    return handleRouteError(error);
  }
}
