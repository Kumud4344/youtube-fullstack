import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import {
  listUserDownloads,
} from "@/services/download.service";

export async function GET() {
  try {
    const session = await requireSession();
    const data = await withDb(() => listUserDownloads(session.sub));
    return apiSuccess(data, "Downloads fetched.");
  } catch (error) {
    return handleRouteError(error);
  }
}
