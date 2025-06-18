import mongoose, { Schema, Document } from "mongoose";

export interface IAnalysisResult extends Document {
  user: mongoose.Types.ObjectId;
  total_stars: number;
  total_forks: number;
  total_watchers: number;
  total_size: number;
  repo_count: number;
  original_repo_count: number;
  forked_repo_count: number;
  average_stars_per_repo: number;
  top_languages: string[];
  language_breakdown: Record<string, number>;
  top_topics: string[];
  topic_breakdown: Record<string, number>;
  most_starred_repo: {
    name: string;
    stars: number;
    url: string;
  };
  most_forked_repo: {
    name: string;
    forks: number;
    url: string;
  };
  recent_repositories: Array<{
    name: string;
    url: string;
    updated_at: Date;
    language: string;
    stars: number;
  }>;
  analysis_date: Date;
}

const AnalysisResultSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
      unique: true,
      index: true,
    },
    total_stars: {
      type: Number,
      default: 0,
      index: true,
    },
    total_forks: {
      type: Number,
      default: 0,
    },
    total_watchers: {
      type: Number,
      default: 0,
    },
    total_size: {
      type: Number,
      default: 0,
    },
    repo_count: {
      type: Number,
      default: 0,
    },
    original_repo_count: {
      type: Number,
      default: 0,
    },
    forked_repo_count: {
      type: Number,
      default: 0,
    },
    average_stars_per_repo: {
      type: Number,
      default: 0,
    },
    top_languages: [
      {
        type: String,
        trim: true,
      },
    ],
    language_breakdown: {
      type: Schema.Types.Mixed,
      default: {},
    },
    top_topics: [
      {
        type: String,
        trim: true,
      },
    ],
    topic_breakdown: {
      type: Schema.Types.Mixed,
      default: {},
    },
    most_starred_repo: {
      name: { type: String, default: "" },
      stars: { type: Number, default: 0 },
      url: { type: String, default: "" },
    },
    most_forked_repo: {
      name: { type: String, default: "" },
      forks: { type: Number, default: 0 },
      url: { type: String, default: "" },
    },
    recent_repositories: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        updated_at: { type: Date, required: true },
        language: { type: String },
        stars: { type: Number, default: 0 },
      },
    ],
    analysis_date: {
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
AnalysisResultSchema.index({ user: 1 }, { unique: true });
AnalysisResultSchema.index({ total_stars: -1 });
AnalysisResultSchema.index({ analysis_date: -1 });

export const AnalysisResult = mongoose.model<IAnalysisResult>(
  "AnalysisResult",
  AnalysisResultSchema
);
