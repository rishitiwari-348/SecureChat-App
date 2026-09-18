import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";
import { VOICE_UPLOAD_DIR } from "./lib/voiceStorage.js";

const __dirname = path.resolve();

const PORT = ENV.PORT || 3000;

app.use(express.json({ limit: "5mb" })); // req.body
const developmentOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = [
  ENV.CLIENT_URL,
  ...(ENV.NODE_ENV === "production" ? [] : developmentOrigins),
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
      } else if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use("/uploads/voice", express.static(VOICE_UPLOAD_DIR, { fallthrough: false, maxAge: "7d" }));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

// Frontend is deployed separately on Vercel.
// Do not serve frontend files from the backend.

server.listen(PORT, () => {
  console.log("Server running on port: " + PORT);
  connectDB();
});
