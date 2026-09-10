import express from "express";
import cors from "cors";

import authRoutes from "../routes/auth.routes.js";
import campusRoutes from "../routes/campus.routes.js";
import roomRoutes from "../routes/room.routes.js";
import messageRoutes from "../routes/message.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CampusVerse server is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/campuses", campusRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);

export default app;