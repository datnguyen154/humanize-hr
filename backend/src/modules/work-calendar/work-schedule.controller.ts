import type { Request, Response } from "express";
import { WorkScheduleError, workScheduleService as service } from "./work-schedule.service";

const handleError = (error: unknown, res: Response) => {
    if (error instanceof WorkScheduleError) {
        return res.status(error.statusCode).json({ code: error.code, message: error.message,
            ...(error.details ? { details: error.details } : {}) });
    }
    console.error(error);
    return res.status(500).json({ code: "INTERNAL_SERVER_ERROR", message: "Không thể xử lý lịch làm việc. Vui lòng thử lại sau." });
};

export const workScheduleController = {
    async list(req: Request, res: Response) {
        try { return res.json(await service.list(req.query)); }
        catch (error) { return handleError(error, res); }
    },
    async getById(req: Request, res: Response) {
        try { return res.json({ data: await service.getById(req.params.id) }); }
        catch (error) { return handleError(error, res); }
    },
    async create(req: Request, res: Response) {
        try { return res.status(201).json({ data: await service.create(req.user!.userId, req.body) }); }
        catch (error) { return handleError(error, res); }
    },
    async update(req: Request, res: Response) {
        try { return res.json({ data: await service.update(req.params.id, req.user!.userId, req.body) }); }
        catch (error) { return handleError(error, res); }
    },
};
