import { translateCommentSchema } from "@/features/social/schemas";
import { apiSuccess } from "@/lib/api/response";
import { handleRouteError, withDb } from "@/lib/api/route-helpers";
import { translateComment } from "@/services/comment.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = translateCommentSchema.parse(await request.json());
    const result = await withDb(() =>
      translateComment({
        commentId: id,
        targetLanguage: body.targetLanguage,
        persist: body.persist,
      }),
    );
    return apiSuccess(result, "Comment translated.");
  } catch (error) {
    return handleRouteError(error);
  }
}
