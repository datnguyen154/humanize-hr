import { Prisma, type AttendanceAdjustmentStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";

export type AdjustmentDbClient = Prisma.TransactionClient;
export type AdjustmentListParams = {
    employeeId?: string;
    status?: AttendanceAdjustmentStatus;
    search?: string;
    skip: number;
    take: number;
};

const adjustmentRelations = {
    employee: { select: { id: true, employeeCode: true, fullName: true } },
    reviewer: { select: { id: true, fullName: true } },
    attendance: { select: { id: true, checkInTime: true, checkOutTime: true, status: true } },
} satisfies Prisma.AttendanceAdjustmentRequestInclude;

export type AdjustmentWithRelations = Prisma.AttendanceAdjustmentRequestGetPayload<{
    include: typeof adjustmentRelations;
}>;

const buildWhere = (params: AdjustmentListParams): Prisma.AttendanceAdjustmentRequestWhereInput => ({
    employeeId: params.employeeId,
    status: params.status,
    employee: params.search?.trim() ? {
        is: {
            OR: [
                { fullName: { contains: params.search.trim(), mode: "insensitive" } },
                { employeeCode: { contains: params.search.trim(), mode: "insensitive" } },
            ],
        },
    } : undefined,
});

export const attendanceAdjustmentRepository = {
    findMany(params: AdjustmentListParams): Promise<AdjustmentWithRelations[]> {
        return prisma.attendanceAdjustmentRequest.findMany({
            where: buildWhere(params),
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: params.skip,
            take: params.take,
            include: adjustmentRelations,
        });
    },
    count(params: AdjustmentListParams): Promise<number> {
        return prisma.attendanceAdjustmentRequest.count({ where: buildWhere(params) });
    },
    findById(id: string, db: AdjustmentDbClient = prisma): Promise<AdjustmentWithRelations | null> {
        return db.attendanceAdjustmentRequest.findUnique({
            where: { id }, include: adjustmentRelations,
        });
    },
    findAttendance(employeeId: string, attendanceDate: Date, db: AdjustmentDbClient = prisma) {
        return db.attendance.findUnique({
            where: { employeeId_attendanceDate: { employeeId, attendanceDate } },
        });
    },
    create(data: Prisma.AttendanceAdjustmentRequestUncheckedCreateInput, db: AdjustmentDbClient = prisma): Promise<AdjustmentWithRelations> {
        return db.attendanceAdjustmentRequest.create({ data, include: adjustmentRelations });
    },
};
