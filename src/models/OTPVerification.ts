import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { OTP_CHANNELS } from "@/constants/app";

const otpVerificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: Object.values(OTP_CHANNELS),
      required: true,
    },
    destination: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["LOGIN", "REGISTER", "RESET_PASSWORD", "VERIFY_CONTACT"],
      required: true,
      index: true,
    },
    otpHash: { type: String, required: true, select: false },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    expiresAt: { type: Date, required: true, index: true },
    consumedAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
);

otpVerificationSchema.index(
  { userId: 1, purpose: 1, consumedAt: 1 },
  { name: "active_otp_lookup" },
);

export type OTPVerificationDocument = InferSchemaType<
  typeof otpVerificationSchema
> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const OTPVerification: Model<OTPVerificationDocument> =
  mongoose.models.OTPVerification ??
  mongoose.model<OTPVerificationDocument>(
    "OTPVerification",
    otpVerificationSchema,
  );
