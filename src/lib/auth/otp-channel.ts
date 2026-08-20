import {
  OTP_CHANNELS,
  SOUTH_INDIAN_STATES,
  type OtpChannel,
} from "@/constants/app";

/**
 * Regional OTP routing:
 * South Indian states → EMAIL OTP
 * All other states → MOBILE OTP
 */
export function resolveOtpChannel(state?: string | null): OtpChannel {
  if (!state) {
    return OTP_CHANNELS.MOBILE;
  }

  const normalized = state.trim().toLowerCase();
  const isSouthIndian = SOUTH_INDIAN_STATES.some(
    (item) => item.toLowerCase() === normalized,
  );

  return isSouthIndian ? OTP_CHANNELS.EMAIL : OTP_CHANNELS.MOBILE;
}
