import type { Request, Response } from "express";

import { AuthServiceError, authService } from "./auth.service";

const handleError = (error: unknown, res: Response): Response => {
    if (error instanceof AuthServiceError) {
        return res.status(error.statusCode).json({
            message: error.message,
        });
    }

    return res.status(500).json({
        message: "Internal server error",
    });
};

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

export const authController = {
    async login(req: Request, res: Response): Promise<Response> {
        try {
            const { email, password } = req.body as {
                email?: unknown;
                password?: unknown;
            };

            if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
                return res.status(400).json({
                    message: "Email and password are required",
                });
            }

            const data = await authService.login(email, password);

            return res.status(200).json({
                message: "Login successful",
                data,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },

    async getCurrentUser(req: Request, res: Response): Promise<Response> {
        try {
            const authenticatedUser = req.user;

            if (!authenticatedUser) {
                return res.status(401).json({
                    message: "Unauthorized",
                });
            }

            const user = await authService.getCurrentUser(
                authenticatedUser.userId,
            );

            return res.status(200).json({
                data: user,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },

    async refreshAccessToken(req: Request, res: Response): Promise<Response> {
        try {
            const { refreshToken } = req.body as {
                refreshToken?: unknown;
            };

            if (!isNonEmptyString(refreshToken)) {
                return res.status(400).json({
                    message: "refreshToken is required",
                });
            }

            const data = await authService.refreshAccessToken(refreshToken);

            return res.status(200).json({
                data,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },

    async logout(req: Request, res: Response): Promise<Response> {
        try {
            const { refreshToken } = req.body as {
                refreshToken?: unknown;
            };

            if (!isNonEmptyString(refreshToken)) {
                return res.status(400).json({
                    message: "refreshToken is required",
                });
            }

            await authService.logout(refreshToken);

            return res.status(200).json({
                message: "Logout successful",
            });
        } catch (error) {
            return handleError(error, res);
        }
    },
};
