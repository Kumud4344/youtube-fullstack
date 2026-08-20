import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const downloadSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },
    downloadedAt: { type: Date, default: Date.now, index: true },
    fileSize: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["completed", "failed"],
      default: "completed",
      index: true,
    },
    dayKey: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

downloadSchema.index({ userId: 1, downloadedAt: -1 });
downloadSchema.index({ userId: 1, dayKey: 1, status: 1 });

export type DownloadDocument = InferSchemaType<typeof downloadSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Download: Model<DownloadDocument> =
  mongoose.models.Download ??
  mongoose.model<DownloadDocument>("Download", downloadSchema);
