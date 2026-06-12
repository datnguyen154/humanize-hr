import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authController } from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/login", authController.login);
authRoutes.get("/me", authenticate, authController.getCurrentUser);
authRoutes.post("/refresh-token", authController.refreshAccessToken);
authRoutes.post("/logout", authController.logout);
