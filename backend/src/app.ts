import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { authRoutes } from "./modules/auth/auth.routes";

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    message: "HRM backend is running",
  });
});

app.use("/api/auth", authRoutes);

export default app;
