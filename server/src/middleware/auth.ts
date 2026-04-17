import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../lib/auth.js";
import { HttpError } from "../lib/http.js";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        username: string;
      };
    }
  }
}

export function requireAuth(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    next(new HttpError(401, "请先登录后再执行该操作"));
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

  try {
    request.authUser = verifyAuthToken(token);
    next();
  } catch (_error) {
    next(new HttpError(401, "登录状态已失效，请重新登录"));
  }
}
