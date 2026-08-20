import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { COMMENT_STATUS } from "@/constants/comments";

const commentSchema = new Schema(
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
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    originalLanguage: { type: String, default: "und" },
    translatedLanguage: { type: String },
    translatedText: { type: String },
    city: { type: String },
    likes: { type: Number, default: 0, min: 0 },
    dislikes: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: Object.values(COMMENT_STATUS),
      default: COMMENT_STATUS.VISIBLE,
      index: true,
    },
  },
  { timestamps: true },
);

commentSchema.index({ videoId: 1, createdAt: -1 });
commentSchema.index({ videoId: 1, status: 1, createdAt: -1 });

export type CommentDocument = InferSchemaType<typeof commentSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Comment: Model<CommentDocument> =
  mongoose.models.Comment ??
  mongoose.model<CommentDocument>("Comment", commentSchema);
