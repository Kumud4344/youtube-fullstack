import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  VIDEO_CATEGORIES,
  VIDEO_PROCESSING_STATUS,
  VIDEO_VISIBILITY,
} from "@/constants/video";

const videoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120, index: true },
    description: { type: String, default: "", maxlength: 5000 },
    slug: { type: String, required: true, unique: true, index: true },
    ownerId: {
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
    storageKey: { type: String, required: true },
    videoUrl: { type: String, required: true },
    thumbnailKey: { type: String },
    thumbnailUrl: { type: String },
    duration: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },
    likesCount: { type: Number, default: 0, min: 0 },
    dislikesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
    downloadsCount: { type: Number, default: 0, min: 0 },
    visibility: {
      type: String,
      enum: Object.values(VIDEO_VISIBILITY),
      default: VIDEO_VISIBILITY.PUBLIC,
      index: true,
    },
    tags: { type: [String], default: [], index: true },
    category: {
      type: String,
      enum: VIDEO_CATEGORIES,
      default: "Other",
      index: true,
    },
    fileSize: { type: Number, required: true, min: 0 },
    mimeType: { type: String, required: true },
    processingStatus: {
      type: String,
      enum: Object.values(VIDEO_PROCESSING_STATUS),
      default: VIDEO_PROCESSING_STATUS.PENDING,
      index: true,
    },
    processingError: { type: String },
  },
  { timestamps: true },
);

videoSchema.index({ createdAt: -1 });
videoSchema.index({ ownerId: 1, createdAt: -1 });
videoSchema.index({ category: 1, createdAt: -1 });
videoSchema.index({ title: "text", description: "text", tags: "text" });

export type VideoDocument = InferSchemaType<typeof videoSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Video: Model<VideoDocument> =
  mongoose.models.Video ?? mongoose.model<VideoDocument>("Video", videoSchema);
