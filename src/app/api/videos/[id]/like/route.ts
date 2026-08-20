import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { reactToVideo } from "@/services/video-reaction.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const result = await withDb(() =>
      reactToVideo({ videoId: id, userId: session.sub, type: "like" }),
    );
    return apiSuccess(result, "Video reaction updated.");
  } catch (error) {
    return handleRouteError(error);
  }
}
