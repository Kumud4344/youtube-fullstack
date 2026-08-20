import { z } from "zod";
import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { removeFriend } from "@/services/friend.service";

const schema = z.object({
  friendId: z.string().min(1),
});

export async function DELETE(request: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await request.json());
    await withDb(() =>
      removeFriend({ userId: session.sub, friendId: body.friendId }),
    );
    return apiSuccess({ ok: true }, "Friend removed.");
  } catch (error) {
    return handleRouteError(error);
  }
}
