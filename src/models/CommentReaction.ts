import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { REACTION_TYPES } from "@/constants/comments";

const commentReactionSchema = new Schema(
  {
    commentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
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

commentReactionSchema.index({ commentId: 1, userId: 1 }, { unique: true });

export type CommentReactionDocument = InferSchemaType<
  typeof commentReactionSchema
> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const CommentReaction: Model<CommentReactionDocument> =
  mongoose.models.CommentReaction ??
  mongoose.model<CommentReactionDocument>(
    "CommentReaction",
    commentReactionSchema,
  );
