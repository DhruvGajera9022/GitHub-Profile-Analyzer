import request from "supertest";
import { Express } from "express";
import { GitHubService } from "../services/github.service";
import { AnalysisResult, Repository, UserProfile } from "../models";
import app from "../app";

describe("GitHub Service Integration Tests", () => {
  let githubService: GitHubService;
  let testApp: Express;

  // Test data - using real GitHub users for testing
  const TEST_USERS = {
    VALID_USER: "dhruvgajera9022",
    POPULAR_USER: "dhruvgajera9022",
    INVALID_USER: "dhruvgajera90223",
    EMPTY_REPOS_USER: "github",
  };

  beforeAll(async () => {
    githubService = new GitHubService();
    testApp = app;
  });

  describe("GET /api/github/profile/:username", () => {
    it("should fetch and analyze a valid user profile", async () => {
      const response = await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.VALID_USER}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.analysis).toBeDefined();
      expect(response.body.data.cached).toBe(false);
      expect(response.body.meta.username).toBe(TEST_USERS.VALID_USER);

      // Verify user data structure
      const userData = response.body.data.user;
      expect(userData.username).toBe(TEST_USERS.VALID_USER);
      expect(userData.name).toBeDefined();
      expect(userData.avatar_url).toMatch(/^https?:\/\//);
      expect(userData.profile_url).toMatch(/^https?:\/\//);
      expect(typeof userData.public_repos).toBe("number");
      expect(typeof userData.followers).toBe("number");
      expect(typeof userData.following).toBe("number");

      // Verify analysis data structure
      const analysisData = response.body.data.analysis;
      expect(typeof analysisData.total_stars).toBe("number");
      expect(typeof analysisData.total_forks).toBe("number");
      expect(typeof analysisData.repo_count).toBe("number");
      expect(Array.isArray(analysisData.top_languages)).toBe(true);
      expect(typeof analysisData.language_breakdown).toBe("object");
      expect(Array.isArray(analysisData.recent_repositories)).toBe(true);
    }, 30000);

    it("should return cached data on second request", async () => {
      // First request
      await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.VALID_USER}`)
        .expect(200);

      // Second request should return cached data
      const response = await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.VALID_USER}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cached).toBe(true);
      expect(response.body.meta.cached).toBe(true);
    }, 30000);

    it("should force refresh when forceRefresh=true", async () => {
      // First request
      await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.VALID_USER}`)
        .expect(200);

      // Force refresh request
      const response = await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.VALID_USER}?forceRefresh=true`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cached).toBe(false);
      expect(response.body.meta.cached).toBe(false);
    }, 30000);

    it("should return 404 for non-existent user", async () => {
      const response = await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.INVALID_USER}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain(
        `GitHub user '${TEST_USERS.INVALID_USER}' not found`
      );
    }, 15000);

    it("should handle users with many repositories", async () => {
      const response = await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.POPULAR_USER}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const analysisData = response.body.data.analysis;

      // Linus should have many repos
      expect(analysisData.repo_count).toBeGreaterThan(10);
      expect(analysisData.total_stars).toBeGreaterThan(0);
      expect(analysisData.top_languages.length).toBeGreaterThan(0);
    }, 45000);
  });

  describe("GET /api/github/profile/:username/stats", () => {
    it("should return stats for analyzed user", async () => {
      // First analyze the user
      await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.VALID_USER}`)
        .expect(200);

      // Then get stats
      const response = await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.VALID_USER}/stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const stats = response.body.data;
      expect(typeof stats.total_stars).toBe("number");
      expect(typeof stats.total_forks).toBe("number");
      expect(typeof stats.repo_count).toBe("number");
      expect(typeof stats.original_repo_count).toBe("number");
      expect(typeof stats.forked_repo_count).toBe("number");
      expect(Array.isArray(stats.top_languages)).toBe(true);
      expect(typeof stats.language_breakdown).toBe("object");
      expect(Array.isArray(stats.recent_repositories)).toBe(true);
    }, 30000);

    it("should return 404 for non-analyzed user", async () => {
      const response = await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.VALID_USER}/stats`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain(
        `GitHub user '${TEST_USERS.VALID_USER}' not found`
      );
    });
  });

  describe("GET /api/github/profile/:username/languages", () => {
    it("should return language breakdown for analyzed user", async () => {
      // First analyze the user
      await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.POPULAR_USER}`)
        .expect(200);

      // Then get languages
      const response = await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.POPULAR_USER}/languages`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      const languages = response.body.data;
      expect(Array.isArray(languages.top_languages)).toBe(true);
      expect(typeof languages.language_breakdown).toBe("object");

      // Should have at least one language for a developer like Linus
      expect(languages.top_languages.length).toBeGreaterThan(0);
      expect(Object.keys(languages.language_breakdown).length).toBeGreaterThan(
        0
      );
    }, 45000);

    it("should return 404 for non-analyzed user", async () => {
      const response = await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.VALID_USER}/languages`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain("not found");
    });
  });

  describe("GET /api/github/users/analyzed", () => {
    it("should return empty list when no users analyzed", async () => {
      const response = await request(testApp)
        .get("/api/github/users/analyzed")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.users).toEqual([]);
      expect(response.body.data.total).toBe(0);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.totalPages).toBe(0);
    });

    it("should return analyzed users with pagination", async () => {
      // Analyze multiple users
      await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.VALID_USER}`)
        .expect(200);

      await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.EMPTY_REPOS_USER}`)
        .expect(200);

      // Get analyzed users
      const response = await request(testApp)
        .get("/api/github/users/analyzed?limit=1")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBe(1);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(1);
      expect(response.body.data.totalPages).toBe(2);

      // Verify user data structure
      const user = response.body.data.users[0];
      expect(user.username).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.avatar_url).toBeDefined();
      expect(typeof user.public_repos).toBe("number");
      expect(typeof user.followers).toBe("number");
      expect(user.updated_at).toBeDefined();
    }, 60000);

    it("should handle pagination correctly", async () => {
      // Analyze a user
      await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.VALID_USER}`)
        .expect(200);

      // Test page 2 (should be empty)
      const response = await request(testApp)
        .get("/api/github/users/analyzed?page=2&limit=10")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBe(0);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.total).toBe(1);
    }, 30000);
  });

  describe("DELETE /api/github/profile/:username/cache", () => {
    it("should clear cache for analyzed user", async () => {
      // First analyze the user
      await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.VALID_USER}`)
        .expect(200);

      // Verify user exists in database
      const userBefore = await UserProfile.findOne({
        username: TEST_USERS.VALID_USER,
      });
      expect(userBefore).toBeTruthy();

      // Clear cache
      const response = await request(testApp)
        .delete(`/api/github/profile/${TEST_USERS.VALID_USER}/cache`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("Cache cleared");

      // Verify user is removed from database
      const userAfter = await UserProfile.findOne({
        username: TEST_USERS.VALID_USER,
      });
      expect(userAfter).toBeFalsy();
    }, 30000);

    it("should return 404 when clearing cache for non-existent user", async () => {
      const response = await request(testApp)
        .delete(`/api/github/profile/${TEST_USERS.INVALID_USER}/cache`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain("not found");
    });
  });

  describe("Database Operations", () => {
    it("should save complete user data to database", async () => {
      await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.VALID_USER}`)
        .expect(200);

      // Verify user profile in database
      const user = await UserProfile.findOne({
        username: TEST_USERS.VALID_USER,
      });
      if (!user) {
        throw new Error("User not found");
      }
      expect(user).toBeTruthy();
      expect(user.username).toBe(TEST_USERS.VALID_USER);
      expect(user.name).toBeDefined();
      expect(user.avatar_url).toBeDefined();
      expect(user.profile_url).toBeDefined();

      // Verify repositories in database
      const repos = await Repository.find({ user: user._id });
      expect(repos.length).toBeGreaterThan(0);

      const repo = repos[0];
      expect(repo.name).toBeDefined();
      expect(repo.html_url).toBeDefined();
      expect(typeof repo.stargazers_count).toBe("number");
      expect(typeof repo.forks_count).toBe("number");

      // Verify analysis result in database
      const analysis = await AnalysisResult.findOne({ user: user._id });
      if (!analysis) {
        throw new Error("Analysis not found");
      }
      expect(analysis).toBeTruthy();
      expect(typeof analysis.total_stars).toBe("number");
      expect(typeof analysis.repo_count).toBe("number");
      expect(Array.isArray(analysis.top_languages)).toBe(true);
      expect(typeof analysis.language_breakdown).toBe("object");
    }, 30000);

    it("should update existing user data on re-analysis", async () => {
      // First analysis
      await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.VALID_USER}`)
        .expect(200);

      const userBefore = await UserProfile.findOne({
        username: TEST_USERS.VALID_USER,
      });
      if (!userBefore) {
        throw new Error("User Before not found");
      }
      const firstUpdateTime = userBefore.updated_at;

      // Wait a moment to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Force refresh
      await request(testApp)
        .get(`/api/github/profile/${TEST_USERS.VALID_USER}?forceRefresh=true`)
        .expect(200);

      const userAfter = await UserProfile.findOne({
        username: TEST_USERS.VALID_USER,
      });
      if (!userAfter) {
        throw new Error("User After not found");
      }
      expect(userAfter.updated_at.getTime()).toBeGreaterThan(
        firstUpdateTime.getTime()
      );

      // Should still be only one user record
      const userCount = await UserProfile.countDocuments({
        username: TEST_USERS.VALID_USER,
      });
      expect(userCount).toBe(1);
    }, 45000);
  });

  describe("Error Handling", () => {
    it("should handle GitHub API rate limiting gracefully", async () => {
      // This test may not always trigger rate limiting, but it tests the error handling
      const promises = Array(5)
        .fill(null)
        .map(() =>
          request(testApp).get(
            `/api/github/profile/${TEST_USERS.VALID_USER}?forceRefresh=true`
          )
        );

      const results = await Promise.allSettled(promises);

      // At least one should succeed
      const successCount = results.filter(
        (r) => r.status === "fulfilled"
      ).length;
      expect(successCount).toBeGreaterThan(0);

      // If any failed due to rate limiting, they should have proper error messages
      const failedResults = results.filter((r) => r.status === "rejected");
      failedResults.forEach((result) => {
        if (result.status === "rejected") {
          expect(result.reason).toBeDefined();
        }
      });
    }, 60000);

    it("should validate username parameters", async () => {
      // Test with invalid username characters
      const response = await request(testApp)
        .get("/api/github/profile/invalid@username")
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("Service Methods Direct Testing", () => {
    it("should fetch user data correctly via service", async () => {
      const result = await githubService.getProfile(TEST_USERS.VALID_USER);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.cached).toBe(false);

      expect(result.user.username).toBe(TEST_USERS.VALID_USER);
      expect(result.analysis.repo_count).toBeGreaterThanOrEqual(0);
    }, 30000);

    it("should return cached data via service", async () => {
      // First call
      await githubService.getProfile(TEST_USERS.VALID_USER);

      // Second call should return cached data
      const result = await githubService.getProfile(TEST_USERS.VALID_USER);
      expect(result.cached).toBe(true);
    }, 30000);

    it("should handle service errors correctly", async () => {
      await expect(
        githubService.getProfile(TEST_USERS.INVALID_USER)
      ).rejects.toThrow();
    }, 15000);
  });
});
