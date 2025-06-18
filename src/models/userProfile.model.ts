import mongoose, { Schema, Document } from "mongoose";

export interface IUserProfile extends Document {
  username: string;
  name: string;
  avatar_url: string;
  bio: string;
  location: string;
  public_repos: number;
  followers: number;
  following: number;
  profile_url: string;
  created_at: Date;
  updated_at: Date;
}
const UserProfileSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    avatar_url: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    public_repos: {
      type: Number,
      default: 0,
    },
    followers: {
      type: Number,
      default: 0,
    },
    following: {
      type: Number,
      default: 0,
    },
    profile_url: {
      type: String,
      required: true,
    },
    created_at: {
      type: Date,
      required: true,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
UserProfileSchema.index({ username: 1 }, { unique: true });
UserProfileSchema.index({ updated_at: -1 });
UserProfileSchema.index({ followers: -1 });
UserProfileSchema.index({ public_repos: -1 });

export const UserProfile = mongoose.model<IUserProfile>(
  "UserProfile",
  UserProfileSchema
);
