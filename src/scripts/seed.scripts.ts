import mongoose from "mongoose";
import dotenv from "dotenv";
import { UserProfile, Repository, AnalysisResult } from "../models";
import { logger,env } from "../utils";

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(env.MONGODB_URI || "");

    const user = await UserProfile.create({
      username: "dhruvgajera",
      name: "Dhruv Gajera",
      avatar_url: "https://avatars.githubusercontent.com/u/12345678?v=4",
      bio: "Node.js developer",
      location: "India",
      public_repos: 5,
      followers: 100,
      following: 10,
      profile_url: "https://github.com/dhruvgajera",
      created_at: new Date("2021-01-01"),
      updated_at: new Date(),
    });

    const repos = await Repository.insertMany([
      {
        github_id: 1,
        user: user._id,
        name: "vault-app",
        full_name: "dhruvgajera/vault-app",
        html_url: "https://github.com/dhruvgajera/vault-app",
        language: "TypeScript",
        stargazers_count: 50,
        forks_count: 10,
        watchers_count: 20,
        size: 1234,
        topics: ["security", "node"],
        is_fork: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        github_id: 2,
        user: user._id,
        name: "chat-app",
        full_name: "dhruvgajera/chat-app",
        html_url: "https://github.com/dhruvgajera/chat-app",
        language: "JavaScript",
        stargazers_count: 70,
        forks_count: 15,
        watchers_count: 25,
        size: 4321,
        topics: ["realtime", "socket.io"],
        is_fork: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await AnalysisResult.create({
      user: user._id,
      total_stars: 120,
      total_forks: 25,
      total_watchers: 45,
      top_languages: ["TypeScript", "JavaScript"],
      language_breakdown: {
        TypeScript: 1,
        JavaScript: 1,
      },
      most_starred_repo: {
        name: "chat-app",
        stars: 70,
        url: "https://github.com/dhruvgajera/chat-app",
      },
      repo_count: 2,
    });

    logger.info("✅ Dummy data seeded successfully");
    process.exit(0);
  } catch (err) {
    logger.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
