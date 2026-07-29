import { existsSync } from "fs";
import path from "path";

import PDFDocument from "pdfkit";

import type { EmployeePublishedPayrollForPdf } from "./payroll.repository";

const REGULAR_FONT_NAME = "VietnameseRegular";
const BOLD_FONT_NAME = "VietnameseBold";

const resolveFontPath = (filename: string): string => {
    const candidates = [
        path.resolve(process.cwd(), "assets", "fonts", filename),
        path.resolve(process.cwd(), "backend", "assets", "fonts", filename),
    ];

    const fontPath = candidates.find((candidate) => existsSync(candidate));

    return fontPath ?? candidates[0];
};

const regularFontPath = resolveFontPath("NotoSans-Regular.ttf");
const boldFontPath = resolveFontPath("NotoSans-Bold.ttf");

const formatCurrency = (value: { toString(): string }): string =>
    `${Number(value.toString()).toLocaleString("vi-VN")} VND`;

const formatNote = (note: string | null): string => note ?? "-";

const formatStatus = (status: string): string =>
    status === "PUBLISHED" ? "Đã phát hành" : status;

const addRow = (
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
): void => {
    doc.font(BOLD_FONT_NAME).text(label, { continued: true });
    doc.font(REGULAR_FONT_NAME).text(value);
};

export const generatePayrollPdf = (
    payroll: EmployeePublishedPayrollForPdf,
): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: "A4",
            margin: 50,
        });
        const chunks: Buffer[] = [];

        doc.registerFont(REGULAR_FONT_NAME, regularFontPath);
        doc.registerFont(BOLD_FONT_NAME, boldFontPath);

        doc.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
        });

        doc.on("end", () => {
            resolve(Buffer.concat(chunks));
        });

        doc.on("error", reject);

        doc.font(BOLD_FONT_NAME).fontSize(22).text("BẢNG LƯƠNG", {
            align: "center",
        });
        doc.moveDown(1.5);

        doc.fontSize(12);
        addRow(doc, "Mã nhân viên: ", payroll.employee.employeeCode);
        addRow(doc, "Họ tên: ", payroll.employee.fullName);
        addRow(doc, "Email: ", payroll.employee.email);
        doc.moveDown();

        addRow(doc, "Tháng: ", String(payroll.month).padStart(2, "0"));
        addRow(doc, "Năm: ", String(payroll.year));
        addRow(doc, "Lương cơ bản: ", formatCurrency(payroll.baseSalary));
        addRow(doc, "Thưởng: ", formatCurrency(payroll.bonus));
        addRow(doc, "Khấu trừ: ", formatCurrency(payroll.deduction));
        addRow(doc, "Thực nhận: ", formatCurrency(payroll.netSalary));
        addRow(doc, "Ghi chú: ", formatNote(payroll.note));
        addRow(doc, "Trạng thái: ", formatStatus(payroll.status));

        doc.end();
    });
