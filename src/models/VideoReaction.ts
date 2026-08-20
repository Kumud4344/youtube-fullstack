import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { REACTION_TYPES } from "@/constants/comments";

const videoReactionSchema = new Schema(
  {
    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(REACTION_TYPES),
      required: true,
    },
  },
  { timestamps: true },
);

videoReactionSchema.index({ videoId: 1, userId: 1 }, { unique: true });

export type VideoReactionDocument = InferSchemaType<
  typeof videoReactionSchema
> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const VideoReaction: Model<VideoReactionDocument> =
  mongoose.models.VideoReaction ??
  mongoose.model<VideoReactionDocument>("VideoReaction", videoReactionSchema);
