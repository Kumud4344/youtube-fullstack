import { apiSuccess } from "@/lib/api/response";
import { handleRouteError, withDb } from "@/lib/api/route-helpers";
import { getSessionFromCookies } from "@/lib/auth/session";
import { Subscription } from "@/models/Subscription";
import {
  getRelatedVideos,
  getVideoByIdOrSlug,
  incrementVideoView,
} from "@/services/video.service";
import { getViewerVideoReaction } from "@/services/video-reaction.service";
import { getWatchEntitlement } from "@/services/watch-entitlement.service";
import { WatchHistory } from "@/models/WatchHistory";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getSessionFromCookies();

    const result = await withDb(async () => {
      const video = await getVideoByIdOrSlug(id, session?.sub);
      await incrementVideoView(video.id);
      const related = await getRelatedVideos(video.id, video.category);
      const viewerReaction = await getViewerVideoReaction(
        video.id,
        session?.sub,
      );
      const isSubscribed = session?.sub
        ? Boolean(
            await Subscription.findOne({
              subscriberId: session.sub,
              channelId: video.ownerId,
            }),
          )
        : false;

      let entitlement = null;
      let resumePosition = 0;
      if (session?.sub) {
        entitlement = await getWatchEntitlement({
          userId: session.sub,
          videoId: video.id,
        });
        const history = await WatchHistory.findOne({
          userId: session.sub,
          videoId: video.id,
        }).lean();
        resumePosition = history?.lastPosition ?? 0;
        if (
          entitlement.allowedPositionSeconds !== null &&
          resumePosition > entitlement.allowedPositionSeconds
        ) {
          resumePosition = entitlement.allowedPositionSeconds;
        }
      }

      return {
        video: { ...video, views: video.views + 1 },
        related,
        viewerReaction,
        isSubscribed,
        entitlement,
        resumePosition,
      };
    });

    return apiSuccess(result, "Video fetched.");
  } catch (error) {
    return handleRouteError(error);
  }
}
