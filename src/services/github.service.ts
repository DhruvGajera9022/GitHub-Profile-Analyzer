import axios, { AxiosError } from "axios";
import { UserProfile, Repository, AnalysisResult } from "../models";
import { logger, env, saveGithubData, AppError } from "../utils";
import { GitHubRepo, GitHubUser } from "interface";

export class GitHubService {
  private readonly baseURL = env.GITHUB_URL;
  private readonly headers: Record<string, string>;

  constructor() {
    this.headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "GitHub-Profile-Analyzer",
    };

    if (env.GITHUB_TOKEN) {
      this.headers["Authorization"] = `token ${env.GITHUB_TOKEN}`;
    }
  }

  async getProfile(username: string, forceRefresh = false): Promise<any> {
    const startTime = Date.now();

    try {
      logger.info(`Starting profile analysis for ${username}`, {
        username,
        forceRefresh,
      });

      // Check if user exists in cache and is recent
      if (!forceRefresh) {
        const existingUser = await UserProfile.findOne({ username });
        if (existingUser) {
          const cacheAge =
            Date.now() - new Date(existingUser.updated_at).getTime();
          const cacheValidMinutes = 30;

          if (cacheAge < cacheValidMinutes * 60 * 1000) {
            logger.info(`Returning cached data for ${username}`, {
              username,
              cacheAge: Math.round(cacheAge / 1000),
            });

            const analysisResult = await AnalysisResult.findOne({
              user: existingUser._id,
            });
            return {
              user: existingUser,
              analysis: analysisResult,
              cached: true,
            };
          }
        }
      }

      // Fetch fresh data from GitHub
      const userData = await this.fetchUserData(username);
      const reposData = await this.fetchUserRepos(username);

      logger.info(`Fetched GitHub data for ${username}`, {
        username,
        repoCount: reposData.length,
        followers: userData.followers,
      });

      // Save to database
      await saveGithubData(userData, reposData);

      // Get the saved data
      const user = await UserProfile.findOne({ username });
      const analysisResult = await AnalysisResult.findOne({ user: user?._id });

      const duration = Date.now() - startTime;
      logger.info(`Profile analysis completed for ${username}`, {
        username,
        duration,
      });

      return {
        user,
        analysis: analysisResult,
        cached: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Profile analysis failed for ${username}`, {
        username,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      throw this.handleGitHubError(error, username);
    }
  }

  async getStats(username: string): Promise<any> {
    try {
      logger.info(`Fetching stats for ${username}`);

      const user = await UserProfile.findOne({ username });
      if (!user) {
        throw new AppError(`GitHub user '${username}' not found`, 404);
      }

      const analysisResult = await AnalysisResult.findOne({ user: user._id });
      if (!analysisResult) {
        throw new AppError(`Analysis data for ${username} not found.`, 404);
      }

      logger.info(`Stats retrieved for ${username}`);
      return analysisResult;
    } catch (error) {
      logger.error(`Failed to get stats for ${username}`, {
        username,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async getLanguages(username: string): Promise<any> {
    try {
      logger.info(`Fetching languages for ${username}`);

      const user = await UserProfile.findOne({ username });
      if (!user) {
        throw new AppError(
          `User ${username} not found. Please fetch profile first.`,
          404
        );
      }

      const analysisResult = await AnalysisResult.findOne({ user: user._id });
      if (!analysisResult) {
        throw new AppError(`Analysis data for ${username} not found.`, 404);
      }

      logger.info(`Languages retrieved for ${username}`, {
        username,
        languageCount: Object.keys(analysisResult.language_breakdown).length,
      });

      return {
        top_languages: analysisResult.top_languages,
        language_breakdown: analysisResult.language_breakdown,
      };
    } catch (error) {
      logger.error(`Failed to get languages for ${username}`, {
        username,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async clearCache(username: string): Promise<void> {
    try {
      logger.info(`Clearing cache for ${username}`);

      const user = await UserProfile.findOne({ username });
      if (!user) {
        throw new AppError(`User ${username} not found.`, 404);
      }

      await Promise.all([
        Repository.deleteMany({ user: user._id }),
        AnalysisResult.deleteMany({ user: user._id }),
        UserProfile.deleteOne({ _id: user._id }),
      ]);

      logger.info(`Cache cleared successfully for ${username}`);
    } catch (error) {
      logger.error(`Failed to clear cache for ${username}`, {
        username,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async listAnalyzedUsers(page = 1, limit = 10): Promise<any> {
    try {
      logger.info(`Fetching analyzed users`, { page, limit });

      const skip = (page - 1) * limit;
      const [users, total] = await Promise.all([
        UserProfile.find({})
          .select("username name avatar_url public_repos followers updated_at")
          .sort({ updated_at: -1 })
          .skip(skip)
          .limit(limit),
        UserProfile.countDocuments({}),
      ]);

      logger.info(`Retrieved analyzed users`, {
        page,
        limit,
        total,
        userCount: users.length,
      });

      return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error(`Failed to list analyzed users`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async fetchUserData(username: string): Promise<GitHubUser> {
    try {
      logger.info(`Fetching user data from GitHub API for ${username}`);

      const response = await axios.get(`${this.baseURL}/users/${username}`, {
        headers: this.headers,
        timeout: 10000,
      });

      logger.info(`Successfully fetched user data for ${username}`, {
        username,
        statusCode: response.status,
      });

      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch user data for ${username}`, {
        username,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async fetchUserRepos(username: string): Promise<GitHubRepo[]> {
    try {
      logger.info(`Fetching repositories from GitHub API for ${username}`);

      const allRepos: GitHubRepo[] = [];
      let page = 1;
      const perPage = 100;

      while (true) {
        const response = await axios.get(
          `${this.baseURL}/users/${username}/repos`,
          {
            headers: this.headers,
            params: {
              per_page: perPage,
              page,
              sort: "updated",
              direction: "desc",
            },
            timeout: 15000,
          }
        );

        const repos = response.data;
        allRepos.push(...repos);

        logger.info(`Fetched page ${page} of repositories for ${username}`, {
          username,
          page,
          reposInPage: repos.length,
          totalSoFar: allRepos.length,
        });

        if (repos.length < perPage) {
          break;
        }
        page++;
      }

      logger.info(`Successfully fetched all repositories for ${username}`, {
        username,
        totalRepos: allRepos.length,
        pages: page,
      });

      return allRepos;
    } catch (error) {
      logger.error(`Failed to fetch repositories for ${username}`, {
        username,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private handleGitHubError(error: any, username: string): AppError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 404) {
        return new AppError(`GitHub user '${username}' not found`, 404);
      }

      if (axiosError.response?.status === 403) {
        return new AppError(
          "GitHub API rate limit exceeded. Please try again later.",
          429
        );
      }

      if (axiosError.response?.status === 401) {
        return new AppError("GitHub API authentication failed", 401);
      }

      return new AppError(
        `GitHub API error: ${axiosError.message}`,
        axiosError.response?.status || 500
      );
    }

    return new AppError("An unexpected error occurred", 500);
  }
}
