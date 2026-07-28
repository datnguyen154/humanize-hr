import { AxiosError } from "axios";
import { Pencil, Send } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import {
    usePublishPayrollMutation,
    type Payroll,
    type PayrollMutationResult,
    type PayrollStatus,
} from "@/features/payroll";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import type { ApiErrorResponse } from "@/shared/types";

import { EditPayrollDialog } from "./EditPayrollDialog";

type PayrollDetailDialogProps = {
    payroll: Payroll | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPayrollUpdated: (payroll: PayrollMutationResult) => void;
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

type DetailFieldProps = {
    label: string;
    value: ReactNode;
    className?: string;
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

const getPublishPayrollErrorMessage = (error: unknown) => {
    if (error instanceof AxiosError) {
        const message = (error.response?.data as ApiErrorResponse | undefined)
            ?.message;

        if (error.response?.status === 404) {
            return "Không tìm thấy bảng lương.";
        }

        if (
            error.response?.status === 400 &&
            message === "Only draft payroll can be published"
        ) {
            return "Chỉ bảng lương nháp mới có thể phát hành.";
        }

        return message ?? "Không thể phát hành bảng lương.";
    }

    return "Không thể phát hành bảng lương. Vui lòng thử lại sau.";
};

export function PayrollDetailDialog({
    payroll,
    open,
    onOpenChange,
    onPayrollUpdated,
}: PayrollDetailDialogProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
    const publishPayrollMutation = usePublishPayrollMutation();

    const handleOpenChange = (nextOpen: boolean) => {
        if (publishPayrollMutation.isPending) {
            return;
        }

        if (!nextOpen) {
            setIsEditDialogOpen(false);
            setIsPublishDialogOpen(false);
        }

        onOpenChange(nextOpen);
    };

    const handlePublishPayroll = async () => {
        if (!payroll) {
            return;
        }

        try {
            const publishedPayroll = await publishPayrollMutation.mutateAsync(
                payroll.id,
            );

            onPayrollUpdated(publishedPayroll);
            showSuccessToast("Bảng lương đã được phát hành thành công.");
            setIsPublishDialogOpen(false);
        } catch (error) {
            showErrorToast(
                getPublishPayrollErrorMessage(error),
                "Phát hành bảng lương thất bại",
            );
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="flex max-h-[calc(100vh-2rem)] max-w-lg flex-col overflow-hidden">
                    <DialogHeader className="shrink-0">
                        <DialogTitle>Chi tiết bảng lương</DialogTitle>
                        <DialogDescription>
                            Thông tin chi tiết lương và thu nhập hàng tháng của
                            nhân viên.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                        {payroll ? (
                            <dl className="grid gap-3 py-2 sm:grid-cols-2">
                                <DetailField
                                    label="Mã nhân viên"
                                    value={
                                        payroll.employee?.employeeCode || "N/A"
                                    }
                                />
                                <DetailField
                                    label="Họ tên nhân viên"
                                    value={payroll.employee?.fullName || "N/A"}
                                />
                                <DetailField
                                    label="Email"
                                    value={
                                        <span className="break-all">
                                            {payroll.employee?.email || "N/A"}
                                        </span>
                                    }
                                    className="sm:col-span-2"
                                />
                                <DetailField
                                    label="Kỳ lương"
                                    value={`Tháng ${payroll.month} / ${payroll.year}`}
                                />
                                <DetailField
                                    label="Trạng thái"
                                    value={
                                        <StatusBadge
                                            label={
                                                payrollStatusLabel[
                                                    payroll.status
                                                ]
                                            }
                                            tone={
                                                payrollStatusTone[
                                                    payroll.status
                                                ]
                                            }
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
                                        Thực nhận (Net Salary)
                                    </dt>
                                    <dd className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(payroll.netSalary)}
                                    </dd>
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                        Công thức: Lương cơ bản + Thưởng - Khấu
                                        trừ
                                    </p>
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
                                    className="sm:col-span-2"
                                />
                            </dl>
                        ) : null}
                    </div>

                    <DialogFooter className="shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                        >
                            Đóng
                        </Button>
                        {payroll?.status === "DRAFT" ? (
                            <Button
                                type="button"
                                disabled={publishPayrollMutation.isPending}
                                onClick={() => setIsEditDialogOpen(true)}
                            >
                                <Pencil className="size-4" aria-hidden="true" />
                                Sửa bảng lương
                            </Button>
                        ) : null}
                        {payroll?.status === "DRAFT" ? (
                            <Button
                                type="button"
                                disabled={publishPayrollMutation.isPending}
                                onClick={() => setIsPublishDialogOpen(true)}
                            >
                                <Send className="size-4" aria-hidden="true" />
                                Phát hành
                            </Button>
                        ) : null}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {payroll ? (
                <EditPayrollDialog
                    payroll={payroll}
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    onPayrollUpdated={onPayrollUpdated}
                />
            ) : null}

            {payroll ? (
                <ConfirmDialog
                    open={isPublishDialogOpen}
                    title="Phát hành bảng lương"
                    description="Sau khi phát hành, bảng lương sẽ không thể chỉnh sửa. Bạn có chắc muốn tiếp tục?"
                    actionLabel="Phát hành"
                    pendingLabel="Đang phát hành..."
                    variant="warning"
                    isPending={publishPayrollMutation.isPending}
                    onOpenChange={setIsPublishDialogOpen}
                    onConfirm={() => void handlePublishPayroll()}
                />
            ) : null}
        </>
    );
}
