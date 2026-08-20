import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { CALL_STATUS } from "@/constants/social";

const callSchema = new Schema(
  {
    callerId: {
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
    startedAt: { type: Date },
    endedAt: { type: Date },
    duration: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: Object.values(CALL_STATUS),
      default: CALL_STATUS.CALLING,
      index: true,
    },
    recording: {
      enabled: { type: Boolean, default: false },
      localOnly: { type: Boolean, default: true },
      fileName: { type: String },
      sizeBytes: { type: Number },
    },
  },
  { timestamps: true },
);

callSchema.index({ callerId: 1, createdAt: -1 });
callSchema.index({ receiverId: 1, createdAt: -1 });

export type CallDocument = InferSchemaType<typeof callSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Call: Model<CallDocument> =
  mongoose.models.Call ?? mongoose.model<CallDocument>("Call", callSchema);
