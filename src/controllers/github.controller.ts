import { Request, Response, NextFunction } from "express";
import { GitHubService } from "../services/github.service";
import { logger } from "../utils";

const githubService = new GitHubService();

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  const { username } = req.params;
  const forceRefresh = req.query.forceRefresh === "true";

  try {
    logger.info(`Getting profile for user: ${username}`, {
      username,
      forceRefresh,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    const data = await githubService.getProfile(username, forceRefresh);
    const duration = Date.now() - startTime;

    logger.info(`Profile retrieved successfully for user: ${username}`, {
      username,
      duration,
      dataSize: JSON.stringify(data).length,
    });

    res.status(200).json({
      success: true,
      data,
      meta: {
        username,
        cached: !forceRefresh,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Failed to get profile for user: ${username}`, {
      username,
      error: error instanceof Error ? error.message : String(error),
      duration,
      stack: error instanceof Error ? error.stack : undefined,
    });
    next(error);
  }
};

export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  const { username } = req.params;

  try {
    logger.info(`Getting stats for user: ${username}`, {
      username,
      ip: req.ip,
    });

    const stats = await githubService.getStats(username);
    const duration = Date.now() - startTime;

    logger.info(`Stats retrieved successfully for user: ${username}`, {
      username,
      duration,
      statsCount: Object.keys(stats).length,
    });

    res.status(200).json({
      success: true,
      data: stats,
      meta: {
        username,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Failed to get stats for user: ${username}`, {
      username,
      error: error instanceof Error ? error.message : String(error),
      duration,
    });
    next(error);
  }
};

export const getLanguages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  const { username } = req.params;

  try {
    logger.info(`Getting languages for user: ${username}`, {
      username,
      ip: req.ip,
    });

    const languages = await githubService.getLanguages(username);
    const duration = Date.now() - startTime;

    logger.info(`Languages retrieved successfully for user: ${username}`, {
      username,
      duration,
      languageCount: Object.keys(languages).length,
    });

    res.status(200).json({
      success: true,
      data: languages,
      meta: {
        username,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Failed to get languages for user: ${username}`, {
      username,
      error: error instanceof Error ? error.message : String(error),
      duration,
    });
    next(error);
  }
};

export const clearCache = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  const { username } = req.params;

  try {
    logger.info(`Clearing cache for user: ${username}`, {
      username,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    await githubService.clearCache(username);
    const duration = Date.now() - startTime;

    logger.info(`Cache cleared successfully for user: ${username}`, {
      username,
      duration,
    });

    res.status(200).json({
      success: true,
      message: `Cache cleared for user ${username}`,
      meta: {
        username,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Failed to clear cache for user: ${username}`, {
      username,
      error: error instanceof Error ? error.message : String(error),
      duration,
    });
    next(error);
  }
};

export const listAnalyzedUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    logger.info(`Listing analyzed users`, {
      page,
      limit,
      ip: req.ip,
    });

    const result = await githubService.listAnalyzedUsers(page, limit);
    const duration = Date.now() - startTime;

    logger.info(`Analyzed users retrieved successfully`, {
      page,
      limit,
      total: result.total,
      userCount: result.users.length,
      duration,
    });

    res.status(200).json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Failed to list analyzed users`, {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });
    next(error);
  }
};
