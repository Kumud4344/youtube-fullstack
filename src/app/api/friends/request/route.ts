import { sendFriendRequestSchema } from "@/features/friends/schemas";
import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { sendFriendRequest } from "@/services/friend.service";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = sendFriendRequestSchema.parse(await request.json());
    const result = await withDb(() =>
      sendFriendRequest({
        senderId: session.sub,
        receiverUsername: body.username,
      }),
    );
    return apiSuccess(result, "Friend request sent.", { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
