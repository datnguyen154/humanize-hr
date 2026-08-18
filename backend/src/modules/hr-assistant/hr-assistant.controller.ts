import type { Request, Response } from "express";

import { HrAssistantServiceError, hrAssistantService } from "./hr-assistant.service";

const handleError = (error: unknown, res: Response): Response => {
    if (error instanceof HrAssistantServiceError) {
        return res.status(error.statusCode).json({
            message: error.message,
        });
    }

    console.error(error);

    return res.status(500).json({
        message: "Internal server error",
    });
};

export const hrAssistantController = {
    getQuestions(_req: Request, res: Response): Response {
        return res.status(200).json({
            data: hrAssistantService.getQuestions(),
        });
    },

    async query(req: Request, res: Response): Promise<Response> {
        try {
            const { questionKey } = req.body as {
                questionKey?: unknown;
            };
            const result = await hrAssistantService.query(
                req.user?.userId,
                questionKey,
            );

            return res.status(200).json({
                data: result,
            });
        } catch (error) {
            return handleError(error, res);
        }
    },
};
