import { AppError } from "@/lib/errors/app-error";
import { Subscription } from "@/models/Subscription";
import { User } from "@/models/User";
import { getOwnerVideos } from "@/services/video.service";

export type PublicChannel = {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  city?: string;
  state?: string;
  subscriberCount: number;
  videoCount: number;
  isSubscribed: boolean;
  isOwner: boolean;
};

export async function getChannelByUsername(params: {
  username: string;
  viewerId?: string;
}): Promise<{ channel: PublicChannel; videos: Awaited<ReturnType<typeof getOwnerVideos>> }> {
  const user = await User.findOne({
    username: params.username.toLowerCase(),
  });
  if (!user) throw AppError.notFound("Channel not found.");

  const [subscriberCount, videos, subscription] = await Promise.all([
    Subscription.countDocuments({ channelId: user._id }),
    getOwnerVideos(user._id.toString()),
    params.viewerId
      ? Subscription.findOne({
          subscriberId: params.viewerId,
          channelId: user._id,
        })
      : null,
  ]);

  const publicVideos = videos.filter((video) => video.visibility === "public");

  return {
    channel: {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      avatar: user.avatar ?? undefined,
      bio: user.bio ?? undefined,
      city: user.city ?? undefined,
      state: user.state ?? undefined,
      subscriberCount,
      videoCount: publicVideos.length,
      isSubscribed: Boolean(subscription),
      isOwner: params.viewerId === user._id.toString(),
    },
    videos: params.viewerId === user._id.toString() ? videos : publicVideos,
  };
}

export async function subscribeToChannel(params: {
  viewerId: string;
  username: string;
}) {
  const channel = await User.findOne({
    username: params.username.toLowerCase(),
  });
  if (!channel) throw AppError.notFound("Channel not found.");
  if (channel._id.toString() === params.viewerId) {
    throw AppError.validation("You cannot subscribe to your own channel.");
  }

  await Subscription.updateOne(
    { subscriberId: params.viewerId, channelId: channel._id },
    {
      $setOnInsert: {
        subscriberId: params.viewerId,
        channelId: channel._id,
      },
    },
    { upsert: true },
  );

  const subscriberCount = await Subscription.countDocuments({
    channelId: channel._id,
  });

  return { subscribed: true, subscriberCount };
}

export async function unsubscribeFromChannel(params: {
  viewerId: string;
  username: string;
}) {
  const channel = await User.findOne({
    username: params.username.toLowerCase(),
  });
  if (!channel) throw AppError.notFound("Channel not found.");

  await Subscription.deleteOne({
    subscriberId: params.viewerId,
    channelId: channel._id,
  });

  const subscriberCount = await Subscription.countDocuments({
    channelId: channel._id,
  });

  return { subscribed: false, subscriberCount };
}

export async function listSubscriptions(viewerId: string) {
  const rows = await Subscription.find({ subscriberId: viewerId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const channelIds = rows.map((row) => row.channelId);
  const users = await User.find({ _id: { $in: channelIds } }).lean();
  const map = new Map(users.map((user) => [user._id.toString(), user]));

  return rows
    .map((row) => {
      const user = map.get(row.channelId.toString());
      if (!user) return null;
      return {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        avatar: user.avatar ?? undefined,
        subscribedAt: row.createdAt.toISOString(),
      };
    })
    .filter(Boolean);
}
