import { CALL_STATUS } from "@/constants/social";
import { ERROR_CODES } from "@/constants/errors";
import { AppError } from "@/lib/errors/app-error";
import { Call } from "@/models/Call";
import { User } from "@/models/User";
import { areFriends } from "@/services/friend.service";

export async function createCall(params: {
  callerId: string;
  receiverId: string;
}) {
  if (params.callerId === params.receiverId) {
    throw AppError.validation("Cannot call yourself.");
  }

  const receiver = await User.findById(params.receiverId);
  if (!receiver) throw AppError.notFound("User not found.");

  const friends = await areFriends(params.callerId, params.receiverId);
  if (!friends) {
    throw new AppError(
      ERROR_CODES.CALL_NOT_AVAILABLE,
      "You can only call accepted friends.",
      403,
    );
  }

  const call = await Call.create({
    callerId: params.callerId,
    receiverId: params.receiverId,
    status: CALL_STATUS.CALLING,
  });

  return {
    id: call._id.toString(),
    callerId: params.callerId,
    receiverId: params.receiverId,
    status: call.status,
  };
}

export async function updateCallStatus(params: {
  callId: string;
  userId: string;
  status: (typeof CALL_STATUS)[keyof typeof CALL_STATUS];
}) {
  const call = await Call.findById(params.callId);
  if (!call) throw AppError.notFound("Call not found.");

  const participant =
    call.callerId.toString() === params.userId ||
    call.receiverId.toString() === params.userId;
  if (!participant) throw AppError.forbidden();

  call.status = params.status;

  if (params.status === CALL_STATUS.CONNECTED && !call.startedAt) {
    call.startedAt = new Date();
  }

  if (
    params.status === CALL_STATUS.ENDED ||
    params.status === CALL_STATUS.FAILED
  ) {
    call.endedAt = new Date();
    if (call.startedAt) {
      call.duration = Math.max(
        0,
        Math.floor((call.endedAt.getTime() - call.startedAt.getTime()) / 1000),
      );
    }
  }

  await call.save();
  return {
    id: call._id.toString(),
    status: call.status,
    duration: call.duration,
    startedAt: call.startedAt?.toISOString() ?? null,
    endedAt: call.endedAt?.toISOString() ?? null,
  };
}

export async function getCallForUser(callId: string, userId: string) {
  const call = await Call.findById(callId);
  if (!call) throw AppError.notFound("Call not found.");
  if (
    call.callerId.toString() !== userId &&
    call.receiverId.toString() !== userId
  ) {
    throw AppError.forbidden();
  }

  const [caller, receiver] = await Promise.all([
    User.findById(call.callerId),
    User.findById(call.receiverId),
  ]);

  return {
    id: call._id.toString(),
    status: call.status,
    duration: call.duration,
    startedAt: call.startedAt?.toISOString() ?? null,
    endedAt: call.endedAt?.toISOString() ?? null,
    caller: caller
      ? {
          id: caller._id.toString(),
          name: caller.name,
          username: caller.username,
        }
      : null,
    receiver: receiver
      ? {
          id: receiver._id.toString(),
          name: receiver.name,
          username: receiver.username,
        }
      : null,
  };
}

export async function listRecentCalls(userId: string) {
  const calls = await Call.find({
    $or: [{ callerId: userId }, { receiverId: userId }],
  })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  return calls.map((call) => ({
    id: call._id.toString(),
    callerId: call.callerId.toString(),
    receiverId: call.receiverId.toString(),
    status: call.status,
    duration: call.duration,
    createdAt: call.createdAt.toISOString(),
  }));
}
