import { z } from "zod";
import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { blockUser, unblockUser } from "@/services/friend.service";

const schema = z.object({
  userId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await request.json());
    await withDb(() =>
      blockUser({ blockerId: session.sub, blockedId: body.userId }),
    );
    return apiSuccess({ ok: true }, "User blocked.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await request.json());
    await withDb(() =>
      unblockUser({ blockerId: session.sub, blockedId: body.userId }),
    );
    return apiSuccess({ ok: true }, "User unblocked.");
  } catch (error) {
    return handleRouteError(error);
  }
}
