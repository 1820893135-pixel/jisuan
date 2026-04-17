import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ override: true });

export const config = {
  port: Number(process.env.PORT || 3001),
  jwtSecret:
    process.env.JWT_SECRET || "lvyou-dev-secret-change-me-before-production",
  dbPath: path.resolve(process.cwd(), process.env.DB_PATH || "data/lvyou.db"),
  amapWebServiceKey: process.env.AMAP_WEB_SERVICE_KEY || "",
};
