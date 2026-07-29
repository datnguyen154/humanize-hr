import { AxiosError } from "axios";
import { Banknote, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, TableRowsSkeleton } from "@/components/ui/skeleton";
import {
    StatusBadge,
    type StatusBadgeTone,
} from "@/components/ui/status-badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    useEmployeePayrollsQuery,
    type EmployeePayroll,
    type PayrollStatus,
} from "@/features/payroll";
import type { ApiErrorResponse } from "@/shared/types";

import { EmployeePayrollDetailDialog } from "./components/EmployeePayrollDetailDialog";

type MonthFilter = "ALL" | number;
type YearFilter = "ALL" | number;

type PaginationControlsProps = {
    page: number;
    totalPages: number;
    totalItems: number;
    fromItem: number;
    toItem: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    onPrevious: () => void;
    onNext: () => void;
};

const monthOptions: Array<{ label: string; value: MonthFilter }> = [
    { label: "Tất cả tháng", value: "ALL" },
    ...Array.from({ length: 12 }, (_, i) => ({
        label: `Tháng ${i + 1}`,
        value: i + 1,
    })),
];

const currentYear = new Date().getFullYear();
const yearOptions: Array<{ label: string; value: YearFilter }> = [
    { label: "Tất cả năm", value: "ALL" },
    ...Array.from({ length: 11 }, (_, index) => {
        const year = currentYear - index;

        return {
            label: `${year}`,
            value: year,
        };
    }),
];

const statusLabel: Record<PayrollStatus, string> = {
    DRAFT: "Bản nháp",
    PUBLISHED: "Đã phát hành",
};

const statusTone: Record<PayrollStatus, StatusBadgeTone> = {
    DRAFT: "warning",
    PUBLISHED: "success",
};

const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "number" ? amount : Number(amount);
    if (Number.isNaN(num)) return "0 ₫";

    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(num);
};

const formatDate = (dateString: string) => {
    if (!dateString) return "Chưa xác định";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat("vi-VN").format(date);
};

const getPayrollErrorMessage = (error: unknown) => {
    if (error instanceof AxiosError) {
        const message = (error.response?.data as ApiErrorResponse | undefined)
            ?.message;

        if (
            error.response?.status === 404 &&
            message === "Employee profile not found"
        ) {
            return "Chưa tìm thấy hồ sơ nhân viên được liên kết với tài khoản này";
        }

        if (error.response?.status === 400) {
            return "Bộ lọc bảng lương không hợp lệ. Vui lòng kiểm tra lại tháng hoặc năm.";
        }

        if (error.response?.status === 404) {
            return "Không tìm thấy dữ liệu bảng lương.";
        }

        return "Không thể tải bảng lương của tôi";
    }

    return "Không thể tải bảng lương của tôi";
};

function PaginationControls({
    page,
    totalPages,
    totalItems,
    fromItem,
    toItem,
    hasPreviousPage,
    hasNextPage,
    onPrevious,
    onNext,
}: PaginationControlsProps) {
    return (
        <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Hiển thị {fromItem}-{toItem} trong tổng số {totalItems} bảng
                lương
            </p>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!hasPreviousPage}
                    aria-label="Trang trước"
                    title="Trang trước"
                    onClick={onPrevious}
                >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                </Button>
                <span className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
                    Trang {page} / {totalPages}
                </span>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!hasNextPage}
                    aria-label="Trang sau"
                    title="Trang sau"
                    onClick={onNext}
                >
                    <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}

export function EmployeePayrollPage() {
    const [page, setPage] = useState(1);
    const [month, setMonth] = useState<MonthFilter>("ALL");
    const [year, setYear] = useState<YearFilter>("ALL");
    const [selectedPayroll, setSelectedPayroll] =
        useState<EmployeePayroll | null>(null);

    const payrollsQuery = useEmployeePayrollsQuery({
        page,
        limit: 10,
        month: month === "ALL" ? undefined : month,
        year: year === "ALL" ? undefined : year,
    });

    const payrolls = payrollsQuery.data?.data ?? [];
    const pagination = payrollsQuery.data?.pagination;
    const totalPages = pagination?.totalPages ?? 1;
    const pageSize = pagination?.limit ?? 10;
    const totalItems = pagination?.totalItems ?? 0;
    const fromItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const toItem = Math.min(page * pageSize, totalItems);
    const errorMessage = payrollsQuery.isError
        ? getPayrollErrorMessage(payrollsQuery.error)
        : null;

    const handleMonthChange = (value: string) => {
        setMonth(value === "ALL" ? "ALL" : Number(value));
        setPage(1);
    };

    const handleYearChange = (value: string) => {
        setYear(value === "ALL" ? "ALL" : Number(value));
        setPage(1);
    };

    const openPayrollDetail = (payroll: EmployeePayroll) => {
        setSelectedPayroll(payroll);
    };

    const handleDetailOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedPayroll(null);
        }
    };

    return (
        <section className="grid min-w-0 gap-6 overflow-x-hidden">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        Bảng lương của tôi
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Theo dõi các bảng lương đã phát hành theo từng kỳ.
                    </p>
                </div>
            </div>

            <Card className="border-border shadow-sm">
                <CardHeader className="gap-4 border-b border-border">
                    <div className="grid gap-1.5">
                        <CardTitle className="text-lg">
                            Danh sách bảng lương
                        </CardTitle>
                        <CardDescription>
                            Dữ liệu chỉ bao gồm bảng lương đã phát hành của bạn.
                        </CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={month}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
                            onChange={(e) => handleMonthChange(e.target.value)}
                        >
                            {monthOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={year}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
                            onChange={(e) => handleYearChange(e.target.value)}
                        >
                            {yearOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        {payrollsQuery.isFetching &&
                        !payrollsQuery.isLoading ? (
                            <span className="text-xs text-muted-foreground">
                                Đang cập nhật...
                            </span>
                        ) : null}
                    </div>
                </CardHeader>

                <CardContent className="pt-6">
                    <div className="block md:hidden">
                        {payrollsQuery.isLoading ? (
                            <div className="grid gap-3">
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="rounded-lg border border-border bg-card p-4 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="grid flex-1 gap-2">
                                                <Skeleton className="h-3 w-24" />
                                                <Skeleton className="h-5 w-36" />
                                            </div>
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </div>
                                        <div className="mt-4 grid gap-3">
                                            <Skeleton className="h-4 w-full max-w-64" />
                                            <Skeleton className="h-4 w-full max-w-48" />
                                            <Skeleton className="h-9 w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        {errorMessage ? (
                            <p className="rounded-lg border border-destructive/20 bg-card px-4 py-8 text-center text-sm text-destructive">
                                {errorMessage}
                            </p>
                        ) : null}

                        {payrollsQuery.isSuccess && payrolls.length === 0 ? (
                            <EmptyState
                                icon={Banknote}
                                title="Chưa có bảng lương"
                                description="Bạn chưa có bảng lương đã phát hành."
                                className="rounded-lg border border-border bg-card px-4"
                            />
                        ) : null}

                        {payrolls.length > 0 ? (
                            <>
                                <div className="grid gap-3">
                                    {payrolls.map((payroll) => (
                                        <article
                                            key={payroll.id}
                                            className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm"
                                        >
                                            <div className="flex min-w-0 items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        Kỳ lương
                                                    </p>
                                                    <h3 className="mt-1 break-words text-base font-semibold text-foreground">
                                                        Tháng {payroll.month} /{" "}
                                                        {payroll.year}
                                                    </h3>
                                                </div>
                                                <StatusBadge
                                                    label={
                                                        statusLabel[
                                                            payroll.status
                                                        ]
                                                    }
                                                    tone={
                                                        statusTone[
                                                            payroll.status
                                                        ]
                                                    }
                                                    className="shrink-0 font-semibold ring-1 ring-current/10"
                                                />
                                            </div>

                                            <dl className="mt-4 grid gap-3 text-sm">
                                                <div>
                                                    <dt className="text-xs font-medium text-muted-foreground">
                                                        Thực nhận
                                                    </dt>
                                                    <dd className="mt-1 text-base font-semibold text-foreground">
                                                        {formatCurrency(
                                                            payroll.netSalary,
                                                        )}
                                                    </dd>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <dt className="text-xs font-medium text-muted-foreground">
                                                            Lương cơ bản
                                                        </dt>
                                                        <dd className="mt-1 text-foreground">
                                                            {formatCurrency(
                                                                payroll.baseSalary,
                                                            )}
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-xs font-medium text-muted-foreground">
                                                            Thưởng
                                                        </dt>
                                                        <dd className="mt-1 text-foreground">
                                                            {formatCurrency(
                                                                payroll.bonus,
                                                            )}
                                                        </dd>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <dt className="text-xs font-medium text-muted-foreground">
                                                            Khấu trừ
                                                        </dt>
                                                        <dd className="mt-1 text-foreground">
                                                            {formatCurrency(
                                                                payroll.deduction,
                                                            )}
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-xs font-medium text-muted-foreground">
                                                            Ngày tạo
                                                        </dt>
                                                        <dd className="mt-1 text-foreground">
                                                            {formatDate(
                                                                payroll.createdAt,
                                                            )}
                                                        </dd>
                                                    </div>
                                                </div>
                                                <div>
                                                    <dt className="text-xs font-medium text-muted-foreground">
                                                        Ngày cập nhật
                                                    </dt>
                                                    <dd className="mt-1 text-foreground">
                                                        {formatDate(
                                                            payroll.updatedAt,
                                                        )}
                                                    </dd>
                                                </div>
                                            </dl>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="mt-4 w-full gap-2"
                                                onClick={() =>
                                                    openPayrollDetail(payroll)
                                                }
                                            >
                                                <Eye
                                                    className="size-4"
                                                    aria-hidden="true"
                                                />
                                                Xem chi tiết
                                            </Button>
                                        </article>
                                    ))}
                                </div>

                                <PaginationControls
                                    page={page}
                                    totalPages={totalPages}
                                    totalItems={totalItems}
                                    fromItem={fromItem}
                                    toItem={toItem}
                                    hasPreviousPage={
                                        pagination?.hasPreviousPage ?? false
                                    }
                                    hasNextPage={
                                        pagination?.hasNextPage ?? false
                                    }
                                    onPrevious={() =>
                                        setPage((current) =>
                                            Math.max(1, current - 1),
                                        )
                                    }
                                    onNext={() =>
                                        setPage((current) => current + 1)
                                    }
                                />
                            </>
                        ) : null}
                    </div>

                    <div className="hidden min-w-0 md:block">
                        {payrollsQuery.isLoading ? (
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Kỳ lương</TableHead>
                                        <TableHead>Lương cơ bản</TableHead>
                                        <TableHead>Thưởng</TableHead>
                                        <TableHead>Khấu trừ</TableHead>
                                        <TableHead>Thực nhận</TableHead>
                                        <TableHead>Ngày tạo</TableHead>
                                        <TableHead>Ngày cập nhật</TableHead>
                                        <TableHead className="text-right">
                                            Thao tác
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRowsSkeleton columns={8} />
                                </TableBody>
                            </Table>
                        ) : null}

                        {errorMessage ? (
                            <p className="py-8 text-center text-destructive">
                                {errorMessage}
                            </p>
                        ) : null}

                        {payrollsQuery.isSuccess && payrolls.length === 0 ? (
                            <EmptyState
                                icon={Banknote}
                                title="Chưa có bảng lương"
                                description="Bạn chưa có bảng lương đã phát hành."
                            />
                        ) : null}

                        {payrolls.length > 0 ? (
                            <>
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead>Kỳ lương</TableHead>
                                            <TableHead>
                                                Lương cơ bản
                                            </TableHead>
                                            <TableHead>Thưởng</TableHead>
                                            <TableHead>Khấu trừ</TableHead>
                                            <TableHead>Thực nhận</TableHead>
                                            <TableHead>Ngày tạo</TableHead>
                                            <TableHead>
                                                Ngày cập nhật
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Thao tác
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payrolls.map((payroll) => (
                                            <TableRow
                                                key={payroll.id}
                                                className="cursor-pointer"
                                                onClick={() =>
                                                    openPayrollDetail(payroll)
                                                }
                                            >
                                                <TableCell className="font-medium">
                                                    Tháng {payroll.month} /{" "}
                                                    {payroll.year}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(
                                                        payroll.baseSalary,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(
                                                        payroll.bonus,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(
                                                        payroll.deduction,
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {formatCurrency(
                                                        payroll.netSalary,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(
                                                        payroll.createdAt,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(
                                                        payroll.updatedAt,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-muted-foreground hover:text-primary"
                                                        aria-label="Xem chi tiết bảng lương"
                                                        title="Xem chi tiết bảng lương"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            openPayrollDetail(
                                                                payroll,
                                                            );
                                                        }}
                                                    >
                                                        <Eye
                                                            className="size-4"
                                                            aria-hidden="true"
                                                        />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <PaginationControls
                                    page={page}
                                    totalPages={totalPages}
                                    totalItems={totalItems}
                                    fromItem={fromItem}
                                    toItem={toItem}
                                    hasPreviousPage={
                                        pagination?.hasPreviousPage ?? false
                                    }
                                    hasNextPage={
                                        pagination?.hasNextPage ?? false
                                    }
                                    onPrevious={() =>
                                        setPage((current) =>
                                            Math.max(1, current - 1),
                                        )
                                    }
                                    onNext={() =>
                                        setPage((current) => current + 1)
                                    }
                                />
                            </>
                        ) : null}
                    </div>
                </CardContent>
            </Card>

            <EmployeePayrollDetailDialog
                payroll={selectedPayroll}
                open={Boolean(selectedPayroll)}
                onOpenChange={handleDetailOpenChange}
            />
        </section>
    );
}
