import { Request, Response, NextFunction } from "express";

export const cacheMiddleware = (maxAge: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set cache headers
    res.set("Cache-Control", `public, max-age=${maxAge}`);
    res.set("ETag", `"${Date.now()}"`);

    next();
  };
};
