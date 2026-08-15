import { AxiosError } from "axios";
import {
    ArrowLeft,
    Ban,
    Building2,
    CalendarPlus,
    ChevronLeft,
    ChevronRight,
    CircleDot,
    FileText,
    History,
    Pencil,
    UserCog,
    type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { DetailPageSkeleton } from "@/components/ui/skeleton";
import { Skeleton, TableRowsSkeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    StatusBadge,
    type StatusBadgeTone,
} from "@/components/ui/status-badge";
import { useDepartmentDetailQuery } from "@/features/department/hooks/useDepartmentsQuery";
import { useUpdateDepartmentStatusMutation } from "@/features/department/hooks/useUpdateDepartmentStatusMutation";
import type { DepartmentStatus } from "@/features/department/types/department.types";
import {
    employeeStatusLabel,
    formatEmployeeDate,
    useEmployeesQuery,
    type EmployeeStatus,
} from "@/features/employee";
import { showErrorToast, showWarningToast } from "@/lib/toast";

const departmentStatusLabel: Record<DepartmentStatus, string> = {
    ACTIVE: "Đang hoạt động",
    INACTIVE: "Tạm ngưng",
};

const departmentStatusTone: Record<DepartmentStatus, StatusBadgeTone> = {
    ACTIVE: "success",
    INACTIVE: "warning",
};

const employeeStatusTone: Record<EmployeeStatus, StatusBadgeTone> = {
    ACTIVE: "success",
    INACTIVE: "warning",
};

const formatDate = (date: string) =>
    new Intl.DateTimeFormat("vi-VN").format(new Date(date));

type ProfileInformationFieldProps = {
    icon: LucideIcon;
    label: string;
    children: ReactNode;
};

function ProfileInformationField({
    icon: Icon,
    label,
    children,
}: ProfileInformationFieldProps) {
    return (
        <div className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 break-words text-sm font-medium text-foreground">
                    {children}
                </dd>
            </div>
        </div>
    );
}

export function DepartmentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const departmentQuery = useDepartmentDetailQuery(id ?? "");
    const updateDepartmentStatusMutation = useUpdateDepartmentStatusMutation();
    const [statusError, setStatusError] = useState<string | null>(null);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [employeePagination, setEmployeePagination] = useState({
        departmentId: id,
        page: 1,
    });
    const department = departmentQuery.data;
    const employeePage =
        employeePagination.departmentId === id ? employeePagination.page : 1;
    const employeesQuery = useEmployeesQuery(
        {
            page: employeePage,
            limit: 10,
            departmentId: id ?? "",
            sortBy: "employeeCode",
            sortOrder: "asc",
        },
        Boolean(id),
    );
    const employees = employeesQuery.data?.data ?? [];
    const employeeMeta = employeesQuery.data?.meta;

    const nextStatus: DepartmentStatus =
        department?.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const handleStatusUpdate = async () => {
        if (!id || !department) {
            return;
        }

        setStatusError(null);

        try {
            await updateDepartmentStatusMutation.mutateAsync({
                id,
                status: nextStatus,
            });
            showWarningToast(
                department.status === "ACTIVE"
                    ? "Phòng ban đã được chuyển sang trạng thái tạm ngưng."
                    : "Phòng ban đã được kích hoạt lại.",
            );
            setIsStatusDialogOpen(false);
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.response?.status === 400) {
                    setStatusError("Trạng thái không hợp lệ");
                    showErrorToast();
                    return;
                }

                if (error.response?.status === 404) {
                    setStatusError("Không tìm thấy phòng ban");
                    showErrorToast();
                    return;
                }
            }

            setStatusError("Cập nhật trạng thái phòng ban thất bại");
            showErrorToast();
        }
    };

    return (
        <section className="grid gap-5">
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="group inline-flex w-fit cursor-pointer items-center gap-2 rounded-md bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/60 hover:text-foreground"
                onClick={() => navigate("/admin/departments")}
            >
                <ArrowLeft
                    className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
                    aria-hidden="true"
                />
                Quay lại danh sách
            </Button>

            {statusError ? (
                <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {statusError}
                </p>
            ) : null}

            {departmentQuery.isLoading ? <DetailPageSkeleton /> : null}

            {departmentQuery.isError ? (
                <Card>
                    <CardContent className="py-12 text-center text-destructive">
                        Không thể tải thông tin phòng ban
                    </CardContent>
                </Card>
            ) : null}

            {department ? (
                <>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                                    <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-primary/5">
                                        <Building2
                                            className="size-9"
                                            aria-hidden="true"
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                                {department.name}
                                            </h2>
                                            <StatusBadge
                                                label={
                                                    departmentStatusLabel[
                                                        department.status
                                                    ]
                                                }
                                                tone={
                                                    departmentStatusTone[
                                                        department.status
                                                    ]
                                                }
                                            />
                                        </div>
                                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                            {department.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                                    <Button
                                        type="button"
                                        className="w-full sm:w-auto"
                                        onClick={() =>
                                            navigate(
                                                `/admin/departments/${id}/edit`,
                                            )
                                        }
                                        disabled={!department}
                                    >
                                        <Pencil
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        Sửa phòng ban
                                    </Button>
                                    <Button
                                        type="button"
                                        className="w-full sm:w-auto"
                                        variant={
                                            department.status === "ACTIVE"
                                                ? "destructive"
                                                : "default"
                                        }
                                        disabled={
                                            updateDepartmentStatusMutation.isPending
                                        }
                                        onClick={() =>
                                            setIsStatusDialogOpen(true)
                                        }
                                    >
                                        {department.status === "ACTIVE" ? (
                                            <Ban
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <UserCog
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        )}
                                        {department.status === "ACTIVE"
                                            ? "Tạm ngưng phòng ban"
                                            : "Kích hoạt lại"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-5 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Thông tin phòng ban
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="divide-y divide-border">
                                    <ProfileInformationField
                                        icon={Building2}
                                        label="Tên phòng ban"
                                    >
                                        {department.name}
                                    </ProfileInformationField>
                                    <ProfileInformationField
                                        icon={FileText}
                                        label="Mô tả"
                                    >
                                        {department.description}
                                    </ProfileInformationField>
                                </dl>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Thông tin hệ thống
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="divide-y divide-border">
                                    <ProfileInformationField
                                        icon={CircleDot}
                                        label="Trạng thái"
                                    >
                                        <StatusBadge
                                            label={
                                                departmentStatusLabel[
                                                    department.status
                                                ]
                                            }
                                            tone={
                                                departmentStatusTone[
                                                    department.status
                                                ]
                                            }
                                        />
                                    </ProfileInformationField>
                                    <ProfileInformationField
                                        icon={CalendarPlus}
                                        label="Ngày tạo"
                                    >
                                        {formatDate(department.createdAt)}
                                    </ProfileInformationField>
                                    <ProfileInformationField
                                        icon={History}
                                        label="Ngày cập nhật"
                                    >
                                        {formatDate(department.updatedAt)}
                                    </ProfileInformationField>
                                </dl>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Nhân viên thuộc phòng ban
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {employeesQuery.isLoading ? (
                                <>
                                    <div className="grid gap-3 md:hidden">
                                        {Array.from({ length: 3 }).map((_, index) => (
                                            <div
                                                key={index}
                                                className="grid gap-3 rounded-lg border border-border p-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="grid flex-1 gap-2">
                                                        <Skeleton className="h-4 w-24" />
                                                        <Skeleton className="h-5 w-40 max-w-full" />
                                                    </div>
                                                    <Skeleton className="h-6 w-24 rounded-full" />
                                                </div>
                                                <Skeleton className="h-4 w-36" />
                                                <Skeleton className="h-4 w-28" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="hidden md:block">
                                        <Table>
                                            <TableBody>
                                                <TableRowsSkeleton columns={5} />
                                            </TableBody>
                                        </Table>
                                    </div>
                                </>
                            ) : null}

                            {employeesQuery.isError ? (
                                <p className="py-8 text-center text-destructive">
                                    Không thể tải danh sách nhân viên của phòng ban.
                                </p>
                            ) : null}

                            {employeesQuery.isSuccess && employees.length === 0 ? (
                                <EmptyState
                                    icon={Building2}
                                    title="Chưa có nhân viên thuộc phòng ban này."
                                    description="Nhân viên được gán vào phòng ban sẽ hiển thị tại đây."
                                />
                            ) : null}

                            {employees.length > 0 ? (
                                <>
                                    <div className="grid gap-3 md:hidden">
                                        {employees.map((employee) => (
                                            <article
                                                key={employee.id}
                                                className="grid min-w-0 gap-3 rounded-lg border border-border p-4"
                                            >
                                                <div className="flex min-w-0 items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-muted-foreground">
                                                            Mã nhân viên
                                                        </p>
                                                        <p className="mt-1 font-medium text-primary">
                                                            {employee.employeeCode}
                                                        </p>
                                                        <h3 className="mt-2 break-words text-base font-semibold text-foreground">
                                                            {employee.fullName}
                                                        </h3>
                                                    </div>
                                                    <StatusBadge
                                                        label={employeeStatusLabel[employee.status]}
                                                        tone={employeeStatusTone[employee.status]}
                                                    />
                                                </div>
                                                <dl className="grid gap-3 text-sm">
                                                    <div>
                                                        <dt className="text-xs font-medium text-muted-foreground">
                                                            Chức vụ
                                                        </dt>
                                                        <dd className="mt-1 break-words text-foreground">
                                                            {employee.position}
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-xs font-medium text-muted-foreground">
                                                            Ngày vào làm
                                                        </dt>
                                                        <dd className="mt-1 text-foreground">
                                                            {formatEmployeeDate(employee.joinedAt)}
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
                                                    <TableHead>Chức vụ</TableHead>
                                                    <TableHead className="text-center">
                                                        Trạng thái
                                                    </TableHead>
                                                    <TableHead>Ngày vào làm</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {employees.map((employee) => (
                                                    <TableRow key={employee.id}>
                                                        <TableCell className="font-medium text-primary">
                                                            {employee.employeeCode}
                                                        </TableCell>
                                                        <TableCell className="max-w-56 whitespace-normal break-words">
                                                            {employee.fullName}
                                                        </TableCell>
                                                        <TableCell className="max-w-56 whitespace-normal break-words">
                                                            {employee.position}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <StatusBadge
                                                                label={employeeStatusLabel[employee.status]}
                                                                tone={employeeStatusTone[employee.status]}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatEmployeeDate(employee.joinedAt)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {employeeMeta && employeeMeta.totalPages > 1 ? (
                                        <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-sm text-muted-foreground">
                                                Trang {employeePage} / {employeeMeta.totalPages}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="size-8"
                                                    disabled={!employeeMeta.hasPreviousPage}
                                                    aria-label="Trang trước"
                                                    title="Trang trước"
                                                    onClick={() =>
                                                        setEmployeePagination({
                                                            departmentId: id,
                                                            page: Math.max(employeePage - 1, 1),
                                                        })
                                                    }
                                                >
                                                    <ChevronLeft className="size-4" aria-hidden="true" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="size-8"
                                                    disabled={!employeeMeta.hasNextPage}
                                                    aria-label="Trang sau"
                                                    title="Trang sau"
                                                    onClick={() =>
                                                        setEmployeePagination({
                                                            departmentId: id,
                                                            page: employeePage + 1,
                                                        })
                                                    }
                                                >
                                                    <ChevronRight className="size-4" aria-hidden="true" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : null}
                                </>
                            ) : null}
                        </CardContent>
                    </Card>

                    <ConfirmDialog
                        open={isStatusDialogOpen}
                        title="Xác nhận cập nhật trạng thái"
                        description="Bạn có chắc chắn muốn thực hiện hành động này?"
                        actionLabel={
                            department.status === "ACTIVE"
                                ? "Tạm ngưng"
                                : "Kích hoạt lại"
                        }
                        variant={
                            department.status === "ACTIVE"
                                ? "warning"
                                : "success"
                        }
                        isPending={updateDepartmentStatusMutation.isPending}
                        onOpenChange={setIsStatusDialogOpen}
                        onConfirm={() => void handleStatusUpdate()}
                    />
                </>
            ) : null}
        </section>
    );
}
