import { createCommentSchema } from "@/features/social/schemas";
import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { getSessionFromCookies } from "@/lib/auth/session";
import { createComment, listComments } from "@/services/comment.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const session = await getSessionFromCookies();

    const result = await withDb(() =>
      listComments({
        videoId: id,
        viewerId: session?.sub,
        cursor: searchParams.get("cursor") ?? undefined,
        limit: Number(searchParams.get("limit") ?? 20),
      }),
    );

    return apiSuccess(result, "Comments fetched.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = createCommentSchema.parse(await request.json());

    const comment = await withDb(() =>
      createComment({
        videoId: id,
        userId: session.sub,
        text: body.text,
      }),
    );

    return apiSuccess({ comment }, "Comment added.", { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
