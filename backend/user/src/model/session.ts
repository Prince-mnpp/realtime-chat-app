import mongoose, { Document } from "mongoose";
import { Schema } from "mongoose";

export interface ISession extends Document{
  userId: mongoose.Types.ObjectId;
  ip?: string;
  userAgent?: string;
  revoked?: boolean;
  expiresAt: Date;
  refreshTokenHash?: string;
}

const sessionSchema: Schema<ISession> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ip: {
      type: String,
      select: false,

    },
    userAgent: {
      type: String,
      select: false,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: {expires: 0},
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Session = mongoose.model<ISession>("Session", sessionSchema);