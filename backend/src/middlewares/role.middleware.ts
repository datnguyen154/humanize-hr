import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";

export const requireRole =
    (...roles: Role[]) =>
    (req: Request, res: Response, next: NextFunction): Response | void => {
        const authenticatedUser = req.user;

        if (!authenticatedUser) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        if (!roles.includes(authenticatedUser.role)) {
            return res.status(403).json({
                message: "Forbidden",
            });
        }

        return next();
    };
