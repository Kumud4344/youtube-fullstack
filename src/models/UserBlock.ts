import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const userBlockSchema = new Schema(
  {
    blockerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    blockedId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

userBlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

export type UserBlockDocument = InferSchemaType<typeof userBlockSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const UserBlock: Model<UserBlockDocument> =
  mongoose.models.UserBlock ??
  mongoose.model<UserBlockDocument>("UserBlock", userBlockSchema);
