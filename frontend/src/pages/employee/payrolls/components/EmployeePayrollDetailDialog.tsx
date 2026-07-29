import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    StatusBadge,
    type StatusBadgeTone,
} from "@/components/ui/status-badge";
import type { EmployeePayroll, PayrollStatus } from "@/features/payroll";

type EmployeePayrollDetailDialogProps = {
    payroll: EmployeePayroll | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type DetailFieldProps = {
    label: string;
    value: ReactNode;
    className?: string;
};

const payrollStatusLabel: Record<PayrollStatus, string> = {
    DRAFT: "Bản nháp",
    PUBLISHED: "Đã phát hành",
};

const payrollStatusTone: Record<PayrollStatus, StatusBadgeTone> = {
    DRAFT: "warning",
    PUBLISHED: "success",
};

const formatCurrency = (amount: number | string) => {
    const numericValue = typeof amount === "number" ? amount : Number(amount);
    if (Number.isNaN(numericValue)) return "0 ₫";

    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(numericValue);
};

const formatPayrollDate = (dateString: string) => {
    if (!dateString) return "Chưa xác định";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
};

function DetailField({ label, value, className = "" }: DetailFieldProps) {
    return (
        <div
            className={`min-w-0 rounded-lg border border-border bg-muted/20 p-3 ${className}`}
        >
            <dt className="text-xs font-medium text-muted-foreground">
                {label}
            </dt>
            <dd className="mt-1 break-words text-sm font-medium text-foreground">
                {value}
            </dd>
        </div>
    );
}

export function EmployeePayrollDetailDialog({
    payroll,
    open,
    onOpenChange,
}: EmployeePayrollDetailDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[calc(100vh-2rem)] max-w-lg flex-col overflow-hidden">
                <DialogHeader className="shrink-0">
                    <DialogTitle>Chi tiết bảng lương</DialogTitle>
                    <DialogDescription>
                        Thông tin bảng lương đã phát hành của bạn.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    {payroll ? (
                        <dl className="grid gap-3 py-2 sm:grid-cols-2">
                            <DetailField
                                label="Kỳ lương"
                                value={`Tháng ${payroll.month} / ${payroll.year}`}
                            />
                            <DetailField
                                label="Trạng thái"
                                value={
                                    <StatusBadge
                                        label={
                                            payrollStatusLabel[payroll.status]
                                        }
                                        tone={payrollStatusTone[payroll.status]}
                                    />
                                }
                            />
                            <DetailField
                                label="Lương cơ bản"
                                value={formatCurrency(payroll.baseSalary)}
                            />
                            <DetailField
                                label="Thưởng"
                                value={formatCurrency(payroll.bonus)}
                            />
                            <DetailField
                                label="Khấu trừ"
                                value={formatCurrency(payroll.deduction)}
                                className="sm:col-span-2"
                            />

                            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:col-span-2">
                                <dt className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                                    Thực nhận
                                </dt>
                                <dd className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(payroll.netSalary)}
                                </dd>
                            </div>

                            {payroll.note ? (
                                <DetailField
                                    label="Ghi chú"
                                    value={payroll.note}
                                    className="sm:col-span-2"
                                />
                            ) : null}

                            <DetailField
                                label="Ngày tạo"
                                value={formatPayrollDate(payroll.createdAt)}
                            />
                            <DetailField
                                label="Ngày cập nhật"
                                value={formatPayrollDate(payroll.updatedAt)}
                            />
                        </dl>
                    ) : null}
                </div>

                <DialogFooter className="shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Đóng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
