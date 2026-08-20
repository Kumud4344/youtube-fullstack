import {
  createPlaylistSchema,
} from "@/features/social/schemas";
import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { createPlaylist, listPlaylists } from "@/services/playlist.service";

export async function GET() {
  try {
    const session = await requireSession();
    const items = await withDb(() => listPlaylists(session.sub));
    return apiSuccess({ items }, "Playlists fetched.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = createPlaylistSchema.parse(await request.json());
    const playlist = await withDb(() =>
      createPlaylist({
        userId: session.sub,
        title: body.title,
        description: body.description,
        visibility: body.visibility,
      }),
    );
    return apiSuccess({ playlist }, "Playlist created.", { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
