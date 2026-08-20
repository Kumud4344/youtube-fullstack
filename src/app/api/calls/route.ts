import { createCallSchema } from "@/features/friends/schemas";
import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { createCall, listRecentCalls } from "@/services/call.service";

export async function GET() {
  try {
    const session = await requireSession();
    const items = await withDb(() => listRecentCalls(session.sub));
    return apiSuccess({ items }, "Calls fetched.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = createCallSchema.parse(await request.json());
    const call = await withDb(() =>
      createCall({
        callerId: session.sub,
        receiverId: body.receiverId,
      }),
    );
    return apiSuccess({ call }, "Call created.", { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
