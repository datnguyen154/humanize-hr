import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import path from "path";

const XLSX_MIME_TYPES = new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
]);

const FIVE_MB_IN_BYTES = 5 * 1024 * 1024;

class UploadValidationError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "UploadValidationError";
    }
}

const employeeImportUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: FIVE_MB_IN_BYTES,
        files: 1,
    },
    fileFilter(_req, file, callback) {
        const extension = path.extname(file.originalname).toLowerCase();

        if (extension !== ".xlsx" || !XLSX_MIME_TYPES.has(file.mimetype)) {
            callback(new UploadValidationError("Invalid file type", 400));
            return;
        }

        callback(null, true);
    },
}).single("file");

export const uploadEmployeeImportFile = (
    req: Request,
    res: Response,
    next: NextFunction,
): Response | void => {
    employeeImportUpload(req, res, (error: unknown) => {
        if (!error) {
            return next();
        }

        if (error instanceof UploadValidationError) {
            return res.status(error.statusCode).json({
                message: error.message,
            });
        }

        if (error instanceof multer.MulterError) {
            if (error.code === "LIMIT_FILE_SIZE") {
                return res.status(413).json({
                    message: "File size must not exceed 5 MB",
                });
            }

            if (
                error.code === "LIMIT_UNEXPECTED_FILE" ||
                error.code === "LIMIT_FILE_COUNT"
            ) {
                return res.status(400).json({
                    message: "Invalid file field",
                });
            }
        }

        console.error(error);

        return res.status(500).json({
            message: "Internal server error",
        });
    });
};
