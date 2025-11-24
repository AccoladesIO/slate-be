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
app.set("trust proxy", 1); // ✅ Fix for cookies behind proxy (Koyeb, Vercel, etc.)
const port = process.env.PORT || 8000;
const env = process.env.NODE_ENV || "development";

/**
 * Allowed origins for CORS.
 */
const allowedOrigins = ["https://myslate.vercel.app", "http://localhost:3000"];

/**
 * Configure and apply CORS middleware.
 */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/**
 * Apply security headers via Helmet.
 */
app.use(
  helmet({
    contentSecurityPolicy: env === "production" ? undefined : false,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/**
 * Application routes.
 */
app.use("/api/auth", authRouter);
app.use("/api/presentation", presentationRouter);
app.use("/api/sharing", sharingRouter);
app.use("/api/share-link", shareLinkRouter);

/**
 * Health check route.
 */
app.get("/", (_req: Request, res: Response) => {
  res.status(200).send("🚀 Slate API is live!");
});

/**
 * 404 handler for unknown routes.
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route does not exist" });
});

/**
 * Global error handler middleware.
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

/**
 * Start the server after connecting to the database and synchronizing models.
 */
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

/**
 * Handle SIGINT for graceful shutdown.
 */
process.on("SIGINT", () => {
  console.log("\n🛑 Server shutting down gracefully...");
  process.exit(0);
});

startServer();
