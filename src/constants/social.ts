export const FRIEND_REQUEST_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
} as const;

export type FriendRequestStatus =
  (typeof FRIEND_REQUEST_STATUS)[keyof typeof FRIEND_REQUEST_STATUS];

export const CALL_STATUS = {
  CALLING: "calling",
  RINGING: "ringing",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  ENDED: "ended",
  FAILED: "failed",
} as const;

export type CallStatus = (typeof CALL_STATUS)[keyof typeof CALL_STATUS];

export const SIGNALING_EVENTS = {
  PRESENCE_UPDATE: "presence:update",
  CALL_INVITE: "call:invite",
  CALL_RINGING: "call:ringing",
  CALL_ACCEPT: "call:accept",
  CALL_REJECT: "call:reject",
  CALL_END: "call:end",
  CALL_FAILED: "call:failed",
  WEBRTC_READY: "webrtc:ready",
  WEBRTC_OFFER: "webrtc:offer",
  WEBRTC_ANSWER: "webrtc:answer",
  WEBRTC_ICE: "webrtc:ice",
} as const;
