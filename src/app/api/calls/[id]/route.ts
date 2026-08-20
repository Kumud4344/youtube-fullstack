import { updateCallStatusSchema } from "@/features/friends/schemas";
import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { getCallForUser, updateCallStatus } from "@/services/call.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const call = await withDb(() => getCallForUser(id, session.sub));
    return apiSuccess({ call }, "Call fetched.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = updateCallStatusSchema.parse(await request.json());
    const call = await withDb(() =>
      updateCallStatus({
        callId: id,
        userId: session.sub,
        status: body.status,
      }),
    );
    return apiSuccess({ call }, "Call updated.");
  } catch (error) {
    return handleRouteError(error);
  }
}
