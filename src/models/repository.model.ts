import mongoose, { Schema, Document } from "mongoose";

export interface IRepository extends Document {
  github_id: number;
  user: mongoose.Types.ObjectId;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  size: number;
  topics: string[];
  license: any;
  is_fork: boolean;
  created_at: Date;
  updated_at: Date;
}

const RepositorySchema: Schema = new Schema(
  {
    github_id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    html_url: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      trim: true,
      index: true,
    },
    stargazers_count: {
      type: Number,
      default: 0,
      index: true,
    },
    forks_count: {
      type: Number,
      default: 0,
    },
    watchers_count: {
      type: Number,
      default: 0,
    },
    size: {
      type: Number,
      default: 0,
    },
    topics: [
      {
        type: String,
        trim: true,
      },
    ],
    license: {
      type: Schema.Types.Mixed,
    },
    is_fork: {
      type: Boolean,
      default: false,
      index: true,
    },
    created_at: {
      type: Date,
      required: true,
    },
    updated_at: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for better query performance
RepositorySchema.index({ user: 1, stargazers_count: -1 });
RepositorySchema.index({ user: 1, updated_at: -1 });
RepositorySchema.index({ user: 1, language: 1 });
RepositorySchema.index({ language: 1, stargazers_count: -1 });

export const Repository = mongoose.model<IRepository>(
  "Repository",
  RepositorySchema
);
