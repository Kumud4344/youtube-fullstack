import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { FRIEND_REQUEST_STATUS } from "@/constants/social";

const friendRequestSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(FRIEND_REQUEST_STATUS),
      default: FRIEND_REQUEST_STATUS.PENDING,
      index: true,
    },
  },
  { timestamps: true },
);

friendRequestSchema.index(
  { senderId: 1, receiverId: 1 },
  { unique: true },
);
friendRequestSchema.index({ receiverId: 1, status: 1, createdAt: -1 });
friendRequestSchema.index({ senderId: 1, status: 1, createdAt: -1 });

export type FriendRequestDocument = InferSchemaType<
  typeof friendRequestSchema
> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const FriendRequest: Model<FriendRequestDocument> =
  mongoose.models.FriendRequest ??
  mongoose.model<FriendRequestDocument>("FriendRequest", friendRequestSchema);
