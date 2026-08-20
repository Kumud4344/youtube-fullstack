import { apiSuccess } from "@/lib/api/response";
import {
  handleRouteError,
  requireSession,
  withDb,
} from "@/lib/api/route-helpers";
import { createSocketToken } from "@/lib/auth/socket-token";
import { User } from "@/models/User";
import { AppError } from "@/lib/errors/app-error";

export async function POST() {
  try {
    const session = await requireSession();
    const token = await withDb(async () => {
      const user = await User.findById(session.sub);
      if (!user) throw AppError.unauthorized();
      return createSocketToken({
        sub: user._id.toString(),
        username: user.username,
        name: user.name,
      });
    });

    return apiSuccess(
      {
        token,
        socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.SOCKET_URL ?? "http://localhost:3001",
      },
      "Socket token issued.",
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
