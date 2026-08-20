import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { USER_PLANS, USER_ROLES } from "@/constants/app";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    passwordHash: { type: String, required: true, select: false },
    avatar: { type: String },
    bio: { type: String, maxlength: 500 },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
      index: true,
    },
    plan: {
      type: String,
      enum: Object.values(USER_PLANS),
      default: USER_PLANS.FREE,
      index: true,
    },
    planExpiresAt: { type: Date, default: null },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    location: { type: String },
    city: { type: String, index: true },
    state: { type: String, index: true },
    country: { type: String },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ createdAt: -1 });
userSchema.index({ name: "text", username: "text", bio: "text" });

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const User: Model<UserDocument> =
  mongoose.models.User ?? mongoose.model<UserDocument>("User", userSchema);
