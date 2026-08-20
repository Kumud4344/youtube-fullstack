import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { USER_PLANS } from "@/constants/app";

const paymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    razorpaySignature: { type: String },
    plan: {
      type: String,
      enum: [USER_PLANS.BRONZE, USER_PLANS.SILVER, USER_PLANS.GOLD],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
      index: true,
    },
    provider: {
      type: String,
      enum: ["razorpay", "mock"],
      default: "razorpay",
    },
    raw: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

paymentSchema.index({ userId: 1, createdAt: -1 });

export type PaymentDocument = InferSchemaType<typeof paymentSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Payment: Model<PaymentDocument> =
  mongoose.models.Payment ??
  mongoose.model<PaymentDocument>("Payment", paymentSchema);
