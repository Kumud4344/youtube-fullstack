import { describe, expect, it } from "vitest";
import { resolveOtpChannel } from "@/lib/auth/otp-channel";
import { OTP_CHANNELS } from "@/constants/app";

describe("resolveOtpChannel", () => {
  it("routes South Indian states to email OTP", () => {
    expect(resolveOtpChannel("Karnataka")).toBe(OTP_CHANNELS.EMAIL);
    expect(resolveOtpChannel("Tamil Nadu")).toBe(OTP_CHANNELS.EMAIL);
    expect(resolveOtpChannel("kerala")).toBe(OTP_CHANNELS.EMAIL);
    expect(resolveOtpChannel("Andhra Pradesh")).toBe(OTP_CHANNELS.EMAIL);
    expect(resolveOtpChannel("Telangana")).toBe(OTP_CHANNELS.EMAIL);
  });

  it("routes other states to mobile OTP", () => {
    expect(resolveOtpChannel("Maharashtra")).toBe(OTP_CHANNELS.MOBILE);
    expect(resolveOtpChannel("Delhi")).toBe(OTP_CHANNELS.MOBILE);
    expect(resolveOtpChannel("West Bengal")).toBe(OTP_CHANNELS.MOBILE);
  });

  it("defaults to mobile when state is missing", () => {
    expect(resolveOtpChannel(undefined)).toBe(OTP_CHANNELS.MOBILE);
    expect(resolveOtpChannel(null)).toBe(OTP_CHANNELS.MOBILE);
    expect(resolveOtpChannel("")).toBe(OTP_CHANNELS.MOBILE);
  });
});
