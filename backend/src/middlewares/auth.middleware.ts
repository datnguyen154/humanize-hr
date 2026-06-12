import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Role } from "@prisma/client";

import { env } from "../config/env";

export type AuthenticatedUserPayload = {
    userId: string;
    role: Role;
};

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUserPayload;
        }
    }
}

const isAuthenticatedUserPayload = (
    payload: JwtPayload,
): payload is JwtPayload & AuthenticatedUserPayload =>
    typeof payload.userId === "string" &&
    (payload.role === "ADMIN" || payload.role === "EMPLOYEE");

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction,
): Response | void => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    if (!env.jwtAccessSecret) {
        return res.status(500).json({
            message: "Internal server error",
        });
    }

    try {
        const decoded = jwt.verify(token, env.jwtAccessSecret);

        if (
            typeof decoded === "string" ||
            !isAuthenticatedUserPayload(decoded)
        ) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };

        return next();
    } catch {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
};
