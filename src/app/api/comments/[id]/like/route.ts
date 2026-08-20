import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { reactToComment } from "@/services/comment.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const comment = await withDb(() =>
      reactToComment({
        commentId: id,
        userId: session.sub,
        type: "like",
      }),
    );
    return apiSuccess({ comment }, "Comment liked.");
  } catch (error) {
    return handleRouteError(error);
  }
}
