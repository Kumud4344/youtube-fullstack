import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import {
  subscribeToChannel,
  unsubscribeFromChannel,
} from "@/services/channel.service";

type Params = { params: Promise<{ username: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { username } = await params;
    const result = await withDb(() =>
      subscribeToChannel({ viewerId: session.sub, username }),
    );
    return apiSuccess(result, "Subscribed.");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { username } = await params;
    const result = await withDb(() =>
      unsubscribeFromChannel({ viewerId: session.sub, username }),
    );
    return apiSuccess(result, "Unsubscribed.");
  } catch (error) {
    return handleRouteError(error);
  }
}
