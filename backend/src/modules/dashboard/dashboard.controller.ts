import type { Request, Response } from "express";

import {
    DashboardServiceError,
    dashboardService,
} from "./dashboard.service";

const handleError = (error: unknown, res: Response): Response => {
    if (error instanceof DashboardServiceError) {
        return res.status(error.statusCode).json({
            message: error.message,
        });
    }

    console.error(error);

    return res.status(500).json({
        message: "Internal server error",
    });
};

export const dashboardController = {
    async getEmployeeDashboard(
        req: Request,
        res: Response,
    ): Promise<Response> {
        try {
            const dashboard = await dashboardService.getEmployeeDashboard(
                req.user?.userId,
            );

            return res.status(200).json({
                data: dashboard,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },
};
