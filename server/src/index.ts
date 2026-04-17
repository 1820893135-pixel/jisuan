import cors from "cors";
import dotenv from "dotenv";
import express, { type NextFunction, type Request, type Response } from "express";
import { config } from "./config.js";
import { HttpError } from "./lib/http.js";
import { authRouter } from "./routes/auth.js";
import { favoritesRouter } from "./routes/favorites.js";
import { travelRouter } from "./routes/travel.js";

dotenv.config({ override: true });

const app = express();

app.use(
  cors({
    origin: true,
  }),
);
app.use(express.json());

app.use("/api", travelRouter);
app.use("/api", authRouter);
app.use("/api", favoritesRouter);

app.use(
  (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction,
  ) => {
    if (error instanceof HttpError) {
      response.status(error.status).json({
        message: error.message,
        details: error.details,
      });
      return;
    }

    console.error("Unhandled server error:", error);
    response.status(500).json({
      message: "服务器内部错误，请稍后再试",
    });
  },
);

app.listen(config.port, () => {
  console.log(`lvyou server is running at http://localhost:${config.port}`);
});
