import express from "express";
import type { Request, Response, NextFunction } from "express";
import wordRoutes from "./routes/wordRoutes.js";

const app = express();

app.use("/words", wordRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((req, res) => {
  res
    .status(404)
    .json({
      error: {
        code: "NOT_FOUND",
        message: `Route ${req.method} ${req.originalUrl} does not exist `,
      },
    });
});

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res
    .status(500)
    .json({
      error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
    });
});

export default app;
