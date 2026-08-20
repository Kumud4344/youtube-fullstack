import { respondFriendRequestSchema } from "@/features/friends/schemas";
import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { respondToFriendRequest } from "@/services/friend.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = respondFriendRequestSchema.parse(await request.json());
    const result = await withDb(() =>
      respondToFriendRequest({
        userId: session.sub,
        requestId: id,
        action: body.action,
      }),
    );
    return apiSuccess(result, `Friend request ${body.action}ed.`);
  } catch (error) {
    return handleRouteError(error);
  }
}
