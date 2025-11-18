import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRouter from "./router/authRoute";
import presentationRouter from "./router/presentation.router";
import sharingRouter from "./router/sharing.router";
import shareLinkRouter from "./router/shareLink.router";
import { connectDB } from "./config/database";
import { syncDatabase } from "./models";

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
const env = process.env.NODE_ENV || "development";

// ────────────────────────────────
// Middleware
// ────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: env === "production" ? undefined : false,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ────────────────────────────────
// Routes
// ────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/presentation", presentationRouter);
app.use("/api/sharing", sharingRouter);
app.use("/api/share-link", shareLinkRouter);

app.get("/", (_req: Request, res: Response) => {
  res.status(200).send("🚀 Slate API is live!");
});

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route does not exist" });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// ────────────────────────────────
// Server Startup
// ────────────────────────────────
const startServer = async () => {
  try {
    console.log("⏳ Connecting to PostgreSQL...");
    await connectDB();

    console.log("⏳ Synchronizing database...");
    await syncDatabase();

    app.listen(port, () => {
      console.log(`✅ Server running in ${env} mode on port ${port}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

// ────────────────────────────────
// Graceful Shutdown
// ────────────────────────────────
process.on("SIGINT", () => {
  console.log("\n🛑 Server shutting down gracefully...");
  process.exit(0);
});

startServer();