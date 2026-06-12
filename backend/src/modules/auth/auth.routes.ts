import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { authController } from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/login", authController.login);
authRoutes.get("/me", authenticate, authController.getCurrentUser);
authRoutes.get("/admin-test", authenticate, requireRole("ADMIN"), (_req, res) => {
    res.status(200).json({
        message: "Admin access granted",
    });
});
authRoutes.post("/refresh-token", authController.refreshAccessToken);
authRoutes.post("/logout", authController.logout);
