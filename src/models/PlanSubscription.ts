import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { USER_PLANS } from "@/constants/app";

/**
 * Premium plan subscription (billing).
 * Distinct from channel Subscription model used for creator follows.
 */
const planSubscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: [USER_PLANS.BRONZE, USER_PLANS.SILVER, USER_PLANS.GOLD, USER_PLANS.FREE],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
  },
  { timestamps: true },
);

planSubscriptionSchema.index({ userId: 1, status: 1, expiresAt: -1 });

export type PlanSubscriptionDocument = InferSchemaType<
  typeof planSubscriptionSchema
> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const PlanSubscription: Model<PlanSubscriptionDocument> =
  mongoose.models.PlanSubscription ??
  mongoose.model<PlanSubscriptionDocument>(
    "PlanSubscription",
    planSubscriptionSchema,
  );
