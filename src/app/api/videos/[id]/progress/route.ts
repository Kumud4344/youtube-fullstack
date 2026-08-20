import { watchProgressSchema } from "@/features/videos/schemas";
import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { upsertWatchProgress } from "@/services/watch-history.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = watchProgressSchema.parse(await request.json());

    const result = await withDb(() =>
      upsertWatchProgress({
        userId: session.sub,
        videoId: id,
        position: body.position,
        watchedSeconds: body.watchedSeconds,
        completed: body.completed,
      }),
    );

    return apiSuccess(
      {
        id: result.entry._id.toString(),
        lastPosition: result.entry.lastPosition,
        watchedSeconds: result.entry.watchedSeconds,
        completed: result.entry.completed,
        entitlement: result.entitlement,
      },
      "Watch progress saved.",
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
