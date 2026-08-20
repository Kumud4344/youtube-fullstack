import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const watchHistorySchema = new Schema(
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
    startedAt: { type: Date, default: Date.now },
    lastPosition: { type: Number, default: 0, min: 0 },
    watchedSeconds: { type: Number, default: 0, min: 0 },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

watchHistorySchema.index({ userId: 1, videoId: 1 }, { unique: true });
watchHistorySchema.index({ userId: 1, updatedAt: -1 });

export type WatchHistoryDocument = InferSchemaType<typeof watchHistorySchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const WatchHistory: Model<WatchHistoryDocument> =
  mongoose.models.WatchHistory ??
  mongoose.model<WatchHistoryDocument>("WatchHistory", watchHistorySchema);
