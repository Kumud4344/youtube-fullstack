import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import {
  clearAllWatchHistory,
  clearWatchHistoryItem,
  listWatchHistory,
} from "@/services/watch-history.service";

export async function GET() {
  try {
    const session = await requireSession();
    const items = await withDb(() => listWatchHistory(session.sub));
    return apiSuccess({ items }, "Watch history fetched.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const historyId = searchParams.get("id");

    await withDb(async () => {
      if (historyId) {
        await clearWatchHistoryItem(session.sub, historyId);
      } else {
        await clearAllWatchHistory(session.sub);
      }
    });

    return apiSuccess({ ok: true }, "Watch history updated.");
  } catch (error) {
    return handleRouteError(error);
  }
}
