import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { listLikedVideos } from "@/services/video-reaction.service";

export async function GET() {
  try {
    const session = await requireSession();
    const items = await withDb(() => listLikedVideos(session.sub));
    return apiSuccess({ items }, "Liked videos fetched.");
  } catch (error) {
    return handleRouteError(error);
  }
}
