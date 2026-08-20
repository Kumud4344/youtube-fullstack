import { apiSuccess } from "@/lib/api/response";
import { handleRouteError, withDb } from "@/lib/api/route-helpers";
import { getSessionFromCookies } from "@/lib/auth/session";
import { getChannelByUsername } from "@/services/channel.service";

type Params = { params: Promise<{ username: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { username } = await params;
    const session = await getSessionFromCookies();
    const result = await withDb(() =>
      getChannelByUsername({
        username,
        viewerId: session?.sub,
      }),
    );
    return apiSuccess(result, "Channel fetched.");
  } catch (error) {
    return handleRouteError(error);
  }
}
