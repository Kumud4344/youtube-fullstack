import type { UserPlan } from "@/constants/app";
import { ERROR_CODES } from "@/constants/errors";
import { getWatchLimitSeconds } from "@/constants/plans";
import { AppError } from "@/lib/errors/app-error";
import { User } from "@/models/User";
import { WatchHistory } from "@/models/WatchHistory";

export type WatchEntitlement = {
  plan: UserPlan;
  watchLimitSeconds: number | null;
  watchedSeconds: number;
  remainingSeconds: number | null;
  limitReached: boolean;
  allowedPositionSeconds: number | null;
};

export async function getWatchEntitlement(params: {
  userId: string;
  videoId: string;
}): Promise<WatchEntitlement> {
  const user = await User.findById(params.userId);
  if (!user) throw AppError.unauthorized();

  const plan = user.plan as UserPlan;
  const watchLimitSeconds = getWatchLimitSeconds(plan);
  const history = await WatchHistory.findOne({
    userId: params.userId,
    videoId: params.videoId,
  }).lean();

  const watchedSeconds = history?.watchedSeconds ?? 0;

  if (watchLimitSeconds === null) {
    return {
      plan,
      watchLimitSeconds: null,
      watchedSeconds,
      remainingSeconds: null,
      limitReached: false,
      allowedPositionSeconds: null,
    };
  }

  const remainingSeconds = Math.max(0, watchLimitSeconds - watchedSeconds);
  const limitReached = watchedSeconds >= watchLimitSeconds;

  return {
    plan,
    watchLimitSeconds,
    watchedSeconds,
    remainingSeconds,
    limitReached,
    allowedPositionSeconds: watchLimitSeconds,
  };
}

export function assertWatchProgressAllowed(params: {
  plan: UserPlan;
  requestedPosition: number;
  requestedWatchedSeconds: number;
  previousWatchedSeconds: number;
}) {
  const limit = getWatchLimitSeconds(params.plan);
  if (limit === null) {
    return {
      position: params.requestedPosition,
      watchedSeconds: Math.max(
        params.previousWatchedSeconds,
        params.requestedWatchedSeconds,
      ),
      limitReached: false,
      watchLimitSeconds: null as number | null,
    };
  }

  const watchedSeconds = Math.min(
    limit,
    Math.max(params.previousWatchedSeconds, params.requestedWatchedSeconds),
  );
  const position = Math.min(limit, params.requestedPosition);
  const limitReached = watchedSeconds >= limit || position >= limit;

  if (
    params.requestedWatchedSeconds > limit ||
    params.requestedPosition > limit
  ) {
    throw new AppError(
      ERROR_CODES.WATCH_LIMIT_REACHED,
      "You have reached your plan watch limit for this video. Upgrade to continue watching.",
      403,
      {
        watchLimitSeconds: limit,
        watchedSeconds,
        position,
        limitReached: true,
      },
    );
  }

  return {
    position,
    watchedSeconds,
    limitReached,
    watchLimitSeconds: limit,
  };
}
