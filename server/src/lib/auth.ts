import jwt, { type JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config.js";
import type { AppUser } from "../types.js";

const tokenPayloadSchema = z.object({
  sub: z.string().min(1),
  username: z.string().min(1),
});

export interface AuthIdentity {
  id: string;
  username: string;
}

export function signAuthToken(user: AppUser) {
  return jwt.sign({ username: user.username }, config.jwtSecret, {
    subject: user.id,
    expiresIn: "7d",
  });
}

export function verifyAuthToken(token: string): AuthIdentity {
  const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
  const parsed = tokenPayloadSchema.safeParse({
    sub: decoded.sub,
    username: decoded.username,
  });

  if (!parsed.success) {
    throw new Error("Invalid auth token payload");
  }

  return {
    id: parsed.data.sub,
    username: parsed.data.username,
  };
}
