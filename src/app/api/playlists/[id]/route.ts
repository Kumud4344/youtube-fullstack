import {
  playlistVideoSchema,
  reorderPlaylistSchema,
  updatePlaylistSchema,
} from "@/features/social/schemas";
import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { getSessionFromCookies } from "@/lib/auth/session";
import {
  addVideoToPlaylist,
  deletePlaylist,
  getPlaylist,
  removeVideoFromPlaylist,
  reorderPlaylistVideos,
  updatePlaylist,
} from "@/services/playlist.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getSessionFromCookies();
    const playlist = await withDb(() =>
      getPlaylist({ playlistId: id, viewerId: session?.sub }),
    );
    return apiSuccess({ playlist }, "Playlist fetched.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = updatePlaylistSchema.parse(await request.json());
    const playlist = await withDb(() =>
      updatePlaylist({
        playlistId: id,
        userId: session.sub,
        ...body,
      }),
    );
    return apiSuccess({ playlist }, "Playlist updated.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await withDb(() => deletePlaylist({ playlistId: id, userId: session.sub }));
    return apiSuccess({ ok: true }, "Playlist deleted.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json();

    if (Array.isArray(body.videoIds)) {
      const parsed = reorderPlaylistSchema.parse(body);
      const playlist = await withDb(() =>
        reorderPlaylistVideos({
          playlistId: id,
          userId: session.sub,
          videoIds: parsed.videoIds,
        }),
      );
      return apiSuccess({ playlist }, "Playlist reordered.");
    }

    const parsed = playlistVideoSchema.parse(body);
    const action = body.action === "remove" ? "remove" : "add";

    const playlist = await withDb(() =>
      action === "remove"
        ? removeVideoFromPlaylist({
            playlistId: id,
            userId: session.sub,
            videoId: parsed.videoId,
          })
        : addVideoToPlaylist({
            playlistId: id,
            userId: session.sub,
            videoId: parsed.videoId,
          }),
    );

    return apiSuccess(
      { playlist },
      action === "remove" ? "Video removed." : "Video added.",
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
