import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Banknote,
    ChevronLeft,
    ChevronRight,
    Search,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
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
    usePayrollsQuery,
    type PayrollSortBy,
    type PayrollSortOrder,
    type PayrollStatus,
} from "@/features/payroll";

type MonthFilter = "ALL" | number;
type YearFilter = "ALL" | number;

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
    { label: `${currentYear - 2}`, value: currentYear - 2 },
    { label: `${currentYear - 1}`, value: currentYear - 1 },
    { label: `${currentYear}`, value: currentYear },
    { label: `${currentYear + 1}`, value: currentYear + 1 },
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
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat("vi-VN").format(date);
};

export function PayrollListPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [month, setMonth] = useState<MonthFilter>("ALL");
    const [year, setYear] = useState<YearFilter>("ALL");
    const [sortBy, setSortBy] = useState<PayrollSortBy>("createdAt");
    const [sortOrder, setSortOrder] = useState<PayrollSortOrder>("desc");

    const payrollsQuery = usePayrollsQuery({
        page,
        limit: 10,
        search: search.trim() || undefined,
        month: month === "ALL" ? undefined : month,
        year: year === "ALL" ? undefined : year,
        sortBy,
        sortOrder,
    });

    const payrolls = payrollsQuery.data?.data ?? [];
    const pagination = payrollsQuery.data?.pagination;
    const totalPages = pagination?.totalPages ?? 1;
    const pageSize = pagination?.limit ?? 10;
    const totalItems = pagination?.totalItems ?? 0;
    const fromItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const toItem = Math.min(page * pageSize, totalItems);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleMonthChange = (value: string) => {
        setMonth(value === "ALL" ? "ALL" : Number(value));
        setPage(1);
    };

    const handleYearChange = (value: string) => {
        setYear(value === "ALL" ? "ALL" : Number(value));
        setPage(1);
    };

    const handleSort = (column: PayrollSortBy) => {
        setPage(1);
        if (sortBy === column) {
            setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
            return;
        }
        setSortBy(column);
        setSortOrder("desc");
    };

    const renderSortIcon = (column: PayrollSortBy) => {
        if (sortBy !== column) {
            return <ArrowUpDown className="size-4 shrink-0" aria-hidden="true" />;
        }

        return sortOrder === "asc" ? (
            <ArrowUp className="size-4 shrink-0" aria-hidden="true" />
        ) : (
            <ArrowDown className="size-4 shrink-0" aria-hidden="true" />
        );
    };

    const renderSortableHeader = (label: string, column: PayrollSortBy) => (
        <Button
            type="button"
            variant="ghost"
            className="h-auto justify-start gap-1 px-0 font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
            onClick={() => handleSort(column)}
        >
            {label}
            {renderSortIcon(column)}
        </Button>
    );

    return (
        <section className="min-w-0 overflow-x-hidden">
            <Card className="min-w-0">
                <CardHeader className="gap-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="grid gap-1.5">
                            <CardTitle className="text-lg">
                                Danh sách bảng lương
                            </CardTitle>
                            <CardDescription>
                                Quản lý và theo dõi thông tin bảng lương hàng
                                tháng của nhân viên.
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="relative w-full md:max-w-xs">
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <Input
                                value={search}
                                placeholder="Tìm theo tên hoặc mã nhân viên..."
                                className="h-10 pl-10"
                                onChange={(event) =>
                                    handleSearchChange(event.target.value)
                                }
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={month}
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                onChange={(e) =>
                                    handleMonthChange(e.target.value)
                                }
                            >
                                {monthOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={year}
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                onChange={(e) =>
                                    handleYearChange(e.target.value)
                                }
                            >
                                {yearOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {payrollsQuery.isLoading ? (
                        <>
                            <div className="grid gap-3 md:hidden">
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="rounded-lg border border-border bg-card p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="grid flex-1 gap-2">
                                                <Skeleton className="h-5 w-36" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </div>
                                        <div className="mt-4 grid gap-3">
                                            <Skeleton className="h-4 w-full max-w-44" />
                                            <Skeleton className="h-4 w-full max-w-64" />
                                            <Skeleton className="h-4 w-full max-w-40" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="hidden md:block">
                                <Table>
                                    <TableBody>
                                        <TableRowsSkeleton columns={9} />
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    ) : null}

                    {payrollsQuery.isError ? (
                        <p className="py-8 text-center text-destructive">
                            Không thể tải danh sách bảng lương
                        </p>
                    ) : null}

                    {payrollsQuery.isSuccess && payrolls.length === 0 ? (
                        <EmptyState
                            icon={Banknote}
                            title="Chưa có bảng lương"
                            description="Danh sách bảng lương sẽ xuất hiện tại đây khi được tạo."
                        />
                    ) : null}

                    {payrolls.length > 0 ? (
                        <>
                            <div className="grid gap-3 md:hidden">
                                {payrolls.map((payroll) => (
                                    <article
                                        key={payroll.id}
                                        className="min-w-0 rounded-lg border border-border bg-card p-4"
                                    >
                                        <div className="flex min-w-0 items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    Nhân viên
                                                </p>
                                                <h3 className="mt-1 break-words text-base font-semibold text-foreground">
                                                    {payroll.employee.fullName}
                                                </h3>
                                                <p className="mt-1 text-sm font-medium text-primary">
                                                    {
                                                        payroll.employee
                                                            .employeeCode
                                                    }
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="mb-1 text-xs font-medium text-muted-foreground">
                                                    Trạng thái
                                                </p>
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
                                                />
                                            </div>
                                        </div>

                                        <dl className="mt-4 grid gap-2 text-sm">
                                            <div>
                                                <dt className="text-xs font-medium text-muted-foreground">
                                                    Kỳ lương
                                                </dt>
                                                <dd className="mt-0.5 font-medium text-foreground">
                                                    Tháng {payroll.month}/
                                                    {payroll.year}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-medium text-muted-foreground">
                                                    Lương cơ bản
                                                </dt>
                                                <dd className="mt-0.5 text-foreground">
                                                    {formatCurrency(
                                                        payroll.baseSalary,
                                                    )}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-medium text-muted-foreground">
                                                    Thưởng / Khấu trừ
                                                </dt>
                                                <dd className="mt-0.5 text-foreground">
                                                    +
                                                    {formatCurrency(
                                                        payroll.bonus,
                                                    )}{" "}
                                                    / -
                                                    {formatCurrency(
                                                        payroll.deduction,
                                                    )}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-medium text-muted-foreground">
                                                    Lương thực nhận
                                                </dt>
                                                <dd className="mt-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(
                                                        payroll.netSalary,
                                                    )}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-medium text-muted-foreground">
                                                    Ngày tạo
                                                </dt>
                                                <dd className="mt-0.5 text-foreground">
                                                    {formatDate(
                                                        payroll.createdAt,
                                                    )}
                                                </dd>
                                            </div>
                                        </dl>
                                    </article>
                                ))}
                            </div>

                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Mã nhân viên</TableHead>
                                            <TableHead>Họ tên</TableHead>
                                            <TableHead>
                                                {renderSortableHeader(
                                                    "Kỳ lương",
                                                    "month",
                                                )}
                                            </TableHead>
                                            <TableHead>
                                                {renderSortableHeader(
                                                    "Lương cơ bản",
                                                    "baseSalary",
                                                )}
                                            </TableHead>
                                            <TableHead>
                                                {renderSortableHeader(
                                                    "Thưởng",
                                                    "bonus",
                                                )}
                                            </TableHead>
                                            <TableHead>
                                                {renderSortableHeader(
                                                    "Khấu trừ",
                                                    "deduction",
                                                )}
                                            </TableHead>
                                            <TableHead>
                                                {renderSortableHeader(
                                                    "Thực nhận",
                                                    "netSalary",
                                                )}
                                            </TableHead>
                                            <TableHead className="text-center">
                                                Trạng thái
                                            </TableHead>
                                            <TableHead>
                                                {renderSortableHeader(
                                                    "Ngày tạo",
                                                    "createdAt",
                                                )}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payrolls.map((payroll) => (
                                            <TableRow key={payroll.id}>
                                                <TableCell className="font-medium text-primary">
                                                    {
                                                        payroll.employee
                                                            .employeeCode
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {payroll.employee.fullName}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    Tháng {payroll.month}/
                                                    {payroll.year}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(
                                                        payroll.baseSalary,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-emerald-600 dark:text-emerald-400">
                                                    +
                                                    {formatCurrency(
                                                        payroll.bonus,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-rose-600 dark:text-rose-400">
                                                    -
                                                    {formatCurrency(
                                                        payroll.deduction,
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-semibold text-foreground">
                                                    {formatCurrency(
                                                        payroll.netSalary,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
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
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(
                                                        payroll.createdAt,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Hiển thị {fromItem} đến {toItem} trong tổng
                                    số {totalItems} bảng lương
                                </p>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="size-8"
                                        disabled={!pagination?.hasPreviousPage}
                                        aria-label="Trang trước"
                                        title="Trang trước"
                                        onClick={() =>
                                            setPage((current) =>
                                                Math.max(current - 1, 1),
                                            )
                                        }
                                    >
                                        <ChevronLeft
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    </Button>
                                    <span className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">
                                        Trang {page} / {totalPages}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="size-8"
                                        disabled={!pagination?.hasNextPage}
                                        aria-label="Trang sau"
                                        title="Trang sau"
                                        onClick={() =>
                                            setPage((current) => current + 1)
                                        }
                                    >
                                        <ChevronRight
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : null}
                </CardContent>
            </Card>
        </section>
    );
}
