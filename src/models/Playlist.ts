import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const playlistVideoSchema = new Schema(
  {
    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    position: { type: Number, required: true, min: 0 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const playlistSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: "", maxlength: 500 },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
      index: true,
    },
    videos: { type: [playlistVideoSchema], default: [] },
  },
  { timestamps: true },
);

playlistSchema.index({ userId: 1, updatedAt: -1 });

export type PlaylistDocument = InferSchemaType<typeof playlistSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Playlist: Model<PlaylistDocument> =
  mongoose.models.Playlist ??
  mongoose.model<PlaylistDocument>("Playlist", playlistSchema);
