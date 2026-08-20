import { Types } from "mongoose";
import { FRIEND_REQUEST_STATUS } from "@/constants/social";
import { AppError } from "@/lib/errors/app-error";
import { FriendRequest } from "@/models/FriendRequest";
import { UserBlock } from "@/models/UserBlock";
import { User } from "@/models/User";

export type PublicFriendUser = {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  city?: string;
};

function toPublicUser(user: {
  _id: Types.ObjectId;
  name: string;
  username: string;
  avatar?: string | null;
  city?: string | null;
}): PublicFriendUser {
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    avatar: user.avatar ?? undefined,
    city: user.city ?? undefined,
  };
}

async function assertNotBlocked(a: string, b: string) {
  const blocked = await UserBlock.findOne({
    $or: [
      { blockerId: a, blockedId: b },
      { blockerId: b, blockedId: a },
    ],
  });
  if (blocked) {
    throw AppError.forbidden("Action not allowed with this user.");
  }
}

export async function searchUsers(params: {
  viewerId: string;
  q: string;
  limit?: number;
}) {
  const q = params.q.trim();
  if (q.length < 2) return [];

  const users = await User.find({
    _id: { $ne: params.viewerId },
    $or: [
      { username: { $regex: q, $options: "i" } },
      { name: { $regex: q, $options: "i" } },
    ],
  })
    .limit(params.limit ?? 20)
    .lean();

  const blocked = await UserBlock.find({
    $or: [{ blockerId: params.viewerId }, { blockedId: params.viewerId }],
  }).lean();
  const blockedIds = new Set(
    blocked.flatMap((row) => [
      row.blockerId.toString(),
      row.blockedId.toString(),
    ]),
  );

  return users
    .filter((user) => !blockedIds.has(user._id.toString()))
    .map(toPublicUser);
}

export async function sendFriendRequest(params: {
  senderId: string;
  receiverUsername: string;
}) {
  const receiver = await User.findOne({
    username: params.receiverUsername.toLowerCase(),
  });
  if (!receiver) throw AppError.notFound("User not found.");
  if (receiver._id.toString() === params.senderId) {
    throw AppError.validation("You cannot friend yourself.");
  }

  await assertNotBlocked(params.senderId, receiver._id.toString());

  const existing = await FriendRequest.findOne({
    $or: [
      { senderId: params.senderId, receiverId: receiver._id },
      { senderId: receiver._id, receiverId: params.senderId },
    ],
  });

  if (existing?.status === FRIEND_REQUEST_STATUS.ACCEPTED) {
    throw AppError.validation("You are already friends.");
  }
  if (
    existing?.status === FRIEND_REQUEST_STATUS.PENDING &&
    existing.senderId.toString() === params.senderId
  ) {
    throw AppError.validation("Friend request already sent.");
  }
  if (
    existing?.status === FRIEND_REQUEST_STATUS.PENDING &&
    existing.receiverId.toString() === params.senderId
  ) {
    existing.status = FRIEND_REQUEST_STATUS.ACCEPTED;
    await existing.save();
    return { status: "accepted" as const, requestId: existing._id.toString() };
  }

  if (existing) {
    existing.senderId = new Types.ObjectId(params.senderId);
    existing.receiverId = receiver._id;
    existing.status = FRIEND_REQUEST_STATUS.PENDING;
    await existing.save();
    return { status: "pending" as const, requestId: existing._id.toString() };
  }

  const request = await FriendRequest.create({
    senderId: params.senderId,
    receiverId: receiver._id,
    status: FRIEND_REQUEST_STATUS.PENDING,
  });

  return { status: "pending" as const, requestId: request._id.toString() };
}

export async function respondToFriendRequest(params: {
  userId: string;
  requestId: string;
  action: "accept" | "reject";
}) {
  const request = await FriendRequest.findById(params.requestId);
  if (!request || request.receiverId.toString() !== params.userId) {
    throw AppError.notFound("Friend request not found.");
  }
  if (request.status !== FRIEND_REQUEST_STATUS.PENDING) {
    throw AppError.validation("Request is no longer pending.");
  }

  request.status =
    params.action === "accept"
      ? FRIEND_REQUEST_STATUS.ACCEPTED
      : FRIEND_REQUEST_STATUS.REJECTED;
  await request.save();
  return { status: request.status };
}

export async function removeFriend(params: {
  userId: string;
  friendId: string;
}) {
  await FriendRequest.deleteMany({
    status: FRIEND_REQUEST_STATUS.ACCEPTED,
    $or: [
      { senderId: params.userId, receiverId: params.friendId },
      { senderId: params.friendId, receiverId: params.userId },
    ],
  });
}

export async function blockUser(params: {
  blockerId: string;
  blockedId: string;
}) {
  if (params.blockerId === params.blockedId) {
    throw AppError.validation("You cannot block yourself.");
  }

  await UserBlock.updateOne(
    { blockerId: params.blockerId, blockedId: params.blockedId },
    {
      $setOnInsert: {
        blockerId: params.blockerId,
        blockedId: params.blockedId,
      },
    },
    { upsert: true },
  );

  await FriendRequest.deleteMany({
    $or: [
      { senderId: params.blockerId, receiverId: params.blockedId },
      { senderId: params.blockedId, receiverId: params.blockerId },
    ],
  });
}

export async function unblockUser(params: {
  blockerId: string;
  blockedId: string;
}) {
  await UserBlock.deleteOne({
    blockerId: params.blockerId,
    blockedId: params.blockedId,
  });
}

export async function listFriends(userId: string) {
  const rows = await FriendRequest.find({
    status: FRIEND_REQUEST_STATUS.ACCEPTED,
    $or: [{ senderId: userId }, { receiverId: userId }],
  }).lean();

  const friendIds = rows.map((row) =>
    row.senderId.toString() === userId
      ? row.receiverId.toString()
      : row.senderId.toString(),
  );

  const users = await User.find({ _id: { $in: friendIds } }).lean();
  return users.map(toPublicUser);
}

export async function listPendingRequests(userId: string) {
  const incoming = await FriendRequest.find({
    receiverId: userId,
    status: FRIEND_REQUEST_STATUS.PENDING,
  })
    .sort({ createdAt: -1 })
    .lean();
  const outgoing = await FriendRequest.find({
    senderId: userId,
    status: FRIEND_REQUEST_STATUS.PENDING,
  })
    .sort({ createdAt: -1 })
    .lean();

  const userIds = [
    ...incoming.map((row) => row.senderId.toString()),
    ...outgoing.map((row) => row.receiverId.toString()),
  ];
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const map = new Map(users.map((user) => [user._id.toString(), user]));

  return {
    incoming: incoming.map((row) => ({
      id: row._id.toString(),
      createdAt: row.createdAt.toISOString(),
      user: toPublicUser(map.get(row.senderId.toString())!),
    })),
    outgoing: outgoing.map((row) => ({
      id: row._id.toString(),
      createdAt: row.createdAt.toISOString(),
      user: toPublicUser(map.get(row.receiverId.toString())!),
    })),
  };
}

export async function areFriends(userA: string, userB: string) {
  const friendship = await FriendRequest.findOne({
    status: FRIEND_REQUEST_STATUS.ACCEPTED,
    $or: [
      { senderId: userA, receiverId: userB },
      { senderId: userB, receiverId: userA },
    ],
  });
  return Boolean(friendship);
}
