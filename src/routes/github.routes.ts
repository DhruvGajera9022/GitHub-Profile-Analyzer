import { Router } from "express";
import {
  getProfile,
  getStats,
  getLanguages,
  clearCache,
  listAnalyzedUsers,
} from "../controllers/github.controller";
import { cacheMiddleware, validateUsername } from "../middlewares";

const router = Router();

// Apply username validation to routes that need it
router.get(
  "/profile/:username",
  validateUsername,
  cacheMiddleware(300),
  getProfile
);
router.get(
  "/profile/:username/stats",
  validateUsername,
  cacheMiddleware(600),
  getStats
);
router.get(
  "/profile/:username/languages",
  validateUsername,
  cacheMiddleware(600),
  getLanguages
);
router.delete("/profile/:username/cache", validateUsername, clearCache);
router.get("/users/analyzed", cacheMiddleware(120), listAnalyzedUsers);

export default router;
