import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriberId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    channelId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

subscriptionSchema.index(
  { subscriberId: 1, channelId: 1 },
  { unique: true },
);
subscriptionSchema.index({ channelId: 1, createdAt: -1 });

export type SubscriptionDocument = InferSchemaType<
  typeof subscriptionSchema
> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Subscription: Model<SubscriptionDocument> =
  mongoose.models.Subscription ??
  mongoose.model<SubscriptionDocument>("Subscription", subscriptionSchema);
