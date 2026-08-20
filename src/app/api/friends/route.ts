import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import {
  listFriends,
  listPendingRequests,
  searchUsers,
} from "@/services/friend.service";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (q) {
      const items = await withDb(() =>
        searchUsers({ viewerId: session.sub, q }),
      );
      return apiSuccess({ items }, "Users found.");
    }

    const data = await withDb(async () => {
      const [friends, requests] = await Promise.all([
        listFriends(session.sub),
        listPendingRequests(session.sub),
      ]);
      return { friends, requests };
    });

    return apiSuccess(data, "Friends fetched.");
  } catch (error) {
    return handleRouteError(error);
  }
}
