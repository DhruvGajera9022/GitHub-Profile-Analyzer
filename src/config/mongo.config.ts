import mongoose from "mongoose";
import { logger, env } from "../utils";

export const connectDB = async (): Promise<void> => {
  try {
    logger.info("Connecting to MongoDB...", {
      uri: env.MONGODB_URI.replace(/\/\/.*@/, "//***:***@"), // Hide credentials in logs
    });

    const conn = await mongoose.connect(env.MONGODB_URI);

    logger.info("MongoDB connected successfully", {
      host: conn.connection.host,
      port: conn.connection.port,
      database: conn.connection.name,
    });

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      logger.info("Closing MongoDB connection...");
      await mongoose.connection.close();
      logger.info("MongoDB connection closed");
      process.exit(0);
    });
  } catch (error) {
    logger.error("MongoDB connection failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
};
