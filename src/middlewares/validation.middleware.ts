import { Request, Response, NextFunction } from "express";
import { AppError, logger } from "../utils";

export const validateUsername = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { username } = req.params;

  if (!username) {
    logger.warn("Username validation failed: Missing username", {
      url: req.originalUrl,
      ip: req.ip,
    });
    return next(new AppError("Username is required", 400));
  }

  // GitHub username validation
  const usernameRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?!-))*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;

  if (!usernameRegex.test(username) || username.length > 39) {
    logger.warn("Username validation failed: Invalid format", {
      username,
      url: req.originalUrl,
      ip: req.ip,
    });
    return next(new AppError("Invalid GitHub username format", 400));
  }

  next();
};
