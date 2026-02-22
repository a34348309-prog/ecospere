import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { notFoundHandler, globalErrorHandler } from "./middleware/errorHandler";
import { generalLimiter } from "./middleware/rateLimiter";

// Route imports
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import eventRoutes from "./routes/event.routes";
import ngoRoutes from "./routes/ngo.routes";
import aqiRoutes from "./routes/aqi.routes";
import leaderboardRoutes from "./routes/leaderboard.routes";
import locationRoutes from "./routes/location.routes";
import carbonRoutes from "./routes/carbon.routes";
import friendRoutes from "./routes/friend.routes";
import activityRoutes from "./routes/activity.routes";

dotenv.config();

const app = express();

// ─── Global Middleware ───────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting (applied globally)
app.use(generalLimiter);

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─── API Documentation ──────────────────────────────────────
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "EcoSphere API Docs",
  }),
);
app.get("/api/docs.json", (req, res) => {
  res.json(swaggerSpec);
});

// ─── API v1 Routes ───────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/ngos", ngoRoutes);
app.use("/api/v1/aqi", aqiRoutes);
app.use("/api/v1/leaderboard", leaderboardRoutes);
app.use("/api/v1/location", locationRoutes);
app.use("/api/v1/carbon", carbonRoutes);
app.use("/api/v1/friends", friendRoutes);
app.use("/api/v1/activities", activityRoutes);

// ─── Legacy Routes (backward compatibility) ─────────────────
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/events", eventRoutes);
app.use("/ngos", ngoRoutes);
app.use("/aqi", aqiRoutes);
app.use("/leaderboard", leaderboardRoutes);

// ─── Health Check ────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "EcoSphere API is running",
    version: "1.0.0",
    docs: "/api/docs",
    endpoints: {
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      events: "/api/v1/events",
      ngos: "/api/v1/ngos",
      aqi: "/api/v1/aqi",
      leaderboard: "/api/v1/leaderboard",
      location: "/api/v1/location",
      carbon: "/api/v1/carbon",
      activities: "/api/v1/activities",
    },
  });
});

// ─── Error Handling ──────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
