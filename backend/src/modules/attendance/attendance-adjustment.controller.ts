import type { Request, Response } from "express";
import { AttendanceAdjustmentError, attendanceAdjustmentService } from "./attendance-adjustment.service";

const actor = (req: Request) => {
    if (!req.user) throw new AttendanceAdjustmentError("Unauthorized", 401);
    return req.user;
};

const handleError = (error: unknown, res: Response): Response => {
    if (error instanceof AttendanceAdjustmentError) {
        return res.status(error.statusCode).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
};

export const attendanceAdjustmentController = {
    async list(req: Request, res: Response): Promise<Response> {
        try {
            const result = await attendanceAdjustmentService.list(actor(req), req.query);
            return res.status(200).json(result);
        } catch (error) { return handleError(error, res); }
    },
    async getById(req: Request, res: Response): Promise<Response> {
        try {
            const result = await attendanceAdjustmentService.getById(req.params.id, actor(req));
            return res.status(200).json({ data: result });
        } catch (error) { return handleError(error, res); }
    },
    async create(req: Request, res: Response): Promise<Response> {
        try {
            const result = await attendanceAdjustmentService.create(actor(req), req.body ?? {});
            return res.status(201).json({ data: result });
        } catch (error) { return handleError(error, res); }
    },
    async review(req: Request, res: Response): Promise<Response> {
        try {
            const result = await attendanceAdjustmentService.review(req.params.id, actor(req), req.body ?? {});
            return res.status(200).json({ data: result });
        } catch (error) { return handleError(error, res); }
    },
};
