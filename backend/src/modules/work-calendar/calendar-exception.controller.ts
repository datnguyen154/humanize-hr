import type { Request, RequestHandler } from "express";
import { calendarExceptionService as service } from "./calendar-exception.service";
import { calendarDate, calendarKeys, invalidCalendar } from "./calendar-exception.validation";
import { handleWorkScheduleError } from "./work-schedule.controller";
import { holidayPresetCatalog } from "./holiday-presets";
import { calendarHolidayBatchService } from "./calendar-holiday-batch.service";

function handler(action: (req: Request) => Promise<unknown>, status = 200, raw = false, query = false): RequestHandler {
    return async (req, res) => {
        try {
            if (!query) calendarKeys(req.query, []);
            const result = await action(req);
            res.status(status).json(raw ? result : { data: result });
        } catch (error) { handleWorkScheduleError(error, res); }
    };
}

export const calendarExceptionController = {
    presets: handler(async (req) => {
        calendarKeys(req.query, ["year"]);
        if (typeof req.query.year !== "string" || !/^[0-9]{4}$/.test(req.query.year)) return invalidCalendar("year", "Năm phải có 4 chữ số từ 0001 đến 9999.");
        calendarDate(`${req.query.year}-01-01`, "year");
        return holidayPresetCatalog(Number(req.query.year));
    }, 200, false, true),
    batchPreview: handler((req) => calendarHolidayBatchService.preview(req.params.versionId, req.body)),
    batchCreate: handler((req) => calendarHolidayBatchService.create(req.params.versionId, req.user!.userId, req.body), 201),
    list: handler((req) => service.list(req.params.versionId, req.query), 200, true, true),
    getById: handler((req) => service.getById(req.params.versionId, req.params.exceptionId)),
    create: handler((req) => service.create(req.params.versionId, req.user!.userId, req.body), 201),
    replace: handler((req) => service.replace(req.params.versionId, req.params.exceptionId, req.user!.userId, req.body)),
    remove: handler((req) => service.remove(req.params.versionId, req.params.exceptionId, req.user!.userId, req.body)),
    preview: handler((req) => service.preview(req.query), 200, false, true),
};
