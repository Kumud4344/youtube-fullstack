import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { USER_PLANS } from "@/constants/app";

const invoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      unique: true,
    },
    planSubscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "PlanSubscription",
    },
    plan: {
      type: String,
      enum: [USER_PLANS.BRONZE, USER_PLANS.SILVER, USER_PLANS.GOLD],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpayOrderId: { type: String },
    issuedAt: { type: Date, default: Date.now },
    htmlSnapshot: { type: String },
  },
  { timestamps: true },
);

invoiceSchema.index({ userId: 1, createdAt: -1 });

export type InvoiceDocument = InferSchemaType<typeof invoiceSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Invoice: Model<InvoiceDocument> =
  mongoose.models.Invoice ??
  mongoose.model<InvoiceDocument>("Invoice", invoiceSchema);
