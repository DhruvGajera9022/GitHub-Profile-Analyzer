import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

import { connectDB } from "./config/mongo.config";

import githubRoutes from "./routes/github.routes";
import { errorHandler, notFoundHandler, requestLogger } from "./middlewares";

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);

// Connect to DB
connectDB();

// Health check route
app.get("/health", (_, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root route
app.get("/", (_, res) => {
  res.status(200).json({
    message: "GitHub Profile Analyzer API",
    version: "1.0.0",
    endpoints: {
      profile: "/api/github/profile/:username",
      stats: "/api/github/profile/:username/stats",
      languages: "/api/github/profile/:username/languages",
      clearCache: "DELETE /api/github/profile/:username/cache",
      analyzedUsers: "/api/github/users/analyzed",
    },
  });
});

// API routes
app.use("/api/github", githubRoutes);

// 404 handler (keep this after all routes)
app.use(notFoundHandler);

// Global error handler (keep this last)
app.use(errorHandler);

export default app;
