import { UserProfile, Repository, AnalysisResult } from "../models";
import { logger } from "./logger.util";

export async function saveGithubData(
  userData: any,
  repos: any[]
): Promise<void> {
  const startTime = Date.now();
  const username = userData.login;

  try {
    logger.info(`Starting data processing for ${username}`, {
      username,
      repoCount: repos.length,
    });

    // Save or update user profile
    const user = await UserProfile.findOneAndUpdate(
      { username: userData.login },
      {
        username: userData.login,
        name: userData.name,
        avatar_url: userData.avatar_url,
        bio: userData.bio,
        location: userData.location,
        public_repos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
        profile_url: userData.html_url,
        created_at: userData.created_at,
        updated_at: new Date(),
      },
      { upsert: true, new: true }
    );

    logger.info(`User profile saved for ${username}`, {
      username,
      userId: user._id,
    });

    // Clear existing repositories and analysis
    await Promise.all([
      Repository.deleteMany({ user: user._id }),
      AnalysisResult.deleteMany({ user: user._id }),
    ]);

    logger.info(`Cleared existing data for ${username}`);

    // Process repositories and calculate statistics
    let totalStars = 0;
    let totalForks = 0;
    let totalWatchers = 0;
    let totalSize = 0;
    const languageMap: Record<string, number> = {};
    const topicMap: Record<string, number> = {};
    let topRepo = { name: "", stars: 0, url: "" };
    let mostForkedRepo = { name: "", forks: 0, url: "" };
    const recentRepos: any[] = [];

    // Batch insert repositories
    const repoDocuments = [];

    for (const repo of repos) {
      // Update statistics
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
      totalWatchers += repo.watchers_count || 0;
      totalSize += repo.size || 0;

      // Track languages
      if (repo.language) {
        languageMap[repo.language] = (languageMap[repo.language] || 0) + 1;
      }

      // Track topics
      if (repo.topics && Array.isArray(repo.topics)) {
        repo.topics.forEach((topic: string) => {
          topicMap[topic] = (topicMap[topic] || 0) + 1;
        });
      }

      // Find top repositories
      if (repo.stargazers_count > topRepo.stars) {
        topRepo = {
          name: repo.name,
          stars: repo.stargazers_count,
          url: repo.html_url,
        };
      }

      if (repo.forks_count > mostForkedRepo.forks) {
        mostForkedRepo = {
          name: repo.name,
          forks: repo.forks_count,
          url: repo.html_url,
        };
      }

      // Track recent repositories (last 10 updated)
      if (recentRepos.length < 10) {
        recentRepos.push({
          name: repo.name,
          url: repo.html_url,
          updated_at: repo.updated_at,
          language: repo.language,
          stars: repo.stargazers_count,
        });
      }

      // Prepare repository document for batch insert
      repoDocuments.push({
        github_id: repo.id,
        user: user._id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        description: repo.description,
        language: repo.language,
        stargazers_count: repo.stargazers_count || 0,
        forks_count: repo.forks_count || 0,
        watchers_count: repo.watchers_count || 0,
        size: repo.size || 0,
        topics: repo.topics || [],
        license: repo.license,
        is_fork: repo.fork || false,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
      });
    }

    // Batch insert repositories
    if (repoDocuments.length > 0) {
      await Repository.insertMany(repoDocuments);
      logger.info(`Saved ${repoDocuments.length} repositories for ${username}`);
    }

    // Calculate additional statistics
    const topLanguages = Object.entries(languageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([lang]) => lang);

    const topTopics = Object.entries(topicMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic);

    const forkedRepos = repos.filter((repo) => repo.fork).length;
    const originalRepos = repos.length - forkedRepos;
    const averageStars =
      repos.length > 0 ? Math.round(totalStars / repos.length) : 0;

    // Create analysis result
    const analysisData = {
      user: user._id,
      total_stars: totalStars,
      total_forks: totalForks,
      total_watchers: totalWatchers,
      total_size: totalSize,
      repo_count: repos.length,
      original_repo_count: originalRepos,
      forked_repo_count: forkedRepos,
      average_stars_per_repo: averageStars,
      top_languages: topLanguages,
      language_breakdown: languageMap,
      top_topics: topTopics,
      topic_breakdown: topicMap,
      most_starred_repo: topRepo,
      most_forked_repo: mostForkedRepo,
      recent_repositories: recentRepos,
      analysis_date: new Date(),
    };

    await AnalysisResult.create(analysisData);

    const duration = Date.now() - startTime;
    logger.info(`Data processing completed for ${username}`, {
      username,
      duration,
      totalStars,
      totalRepos: repos.length,
      originalRepos,
      forkedRepos,
      languageCount: Object.keys(languageMap).length,
      topLanguage: topLanguages[0],
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Data processing failed for ${username}`, {
      username,
      duration,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
