import { AxiosError } from "axios";
import {
    ArrowLeft,
    Ban,
    Briefcase,
    CalendarDays,
    CalendarPlus,
    CircleDot,
    History,
    IdCard,
    Mail,
    Pencil,
    Phone,
    UserCog,
    type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DetailPageSkeleton } from "@/components/ui/skeleton";
import {
    StatusBadge,
    type StatusBadgeTone,
} from "@/components/ui/status-badge";
import {
    employeeStatusLabel,
    formatEmployeeDate,
    useEmployeeDetailQuery,
    useUpdateEmployeeStatusMutation,
    type EmployeeStatus,
} from "@/features/employee";
import { showErrorToast, showWarningToast } from "@/lib/toast";

const employeeStatusTone: Record<EmployeeStatus, StatusBadgeTone> = {
    ACTIVE: "success",
    INACTIVE: "warning",
};

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

export function EmployeeDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const employeeQuery = useEmployeeDetailQuery(id ?? "");
    const updateEmployeeStatusMutation = useUpdateEmployeeStatusMutation();
    const [statusError, setStatusError] = useState<string | null>(null);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const employee = employeeQuery.data;
    const nextStatus: EmployeeStatus =
        employee?.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const avatarFallback = employee?.fullName
        ? employee.fullName
              .trim()
              .split(/\s+/)
              .slice(-2)
              .map((part) => part[0])
              .join("")
              .toUpperCase()
        : "NV";

    const handleStatusUpdate = async () => {
        if (!id || !employee) {
            return;
        }

        setStatusError(null);

        try {
            await updateEmployeeStatusMutation.mutateAsync({
                id,
                status: nextStatus,
            });
            showWarningToast(
                employee.status === "ACTIVE"
                    ? "Nhân viên đã được chuyển sang trạng thái tạm ngưng."
                    : "Nhân viên đã được kích hoạt lại.",
            );
            setIsStatusDialogOpen(false);
        } catch (error) {
            if (error instanceof AxiosError) {
                setStatusError("Cập nhật trạng thái nhân viên thất bại");
                showErrorToast();
                return;
            }

            setStatusError("Cập nhật trạng thái nhân viên thất bại");
            showErrorToast();
        }
    };

    return (
        <section className="grid gap-5">
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => navigate("/admin/employees")}
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Quay lại danh sách
            </Button>

            {statusError ? (
                <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {statusError}
                </p>
            ) : null}

            {employeeQuery.isLoading ? (
                <DetailPageSkeleton />
            ) : null}

            {employeeQuery.isError ? (
                <Card>
                    <CardContent className="py-12 text-center text-destructive">
                        Không thể tải thông tin nhân viên
                    </CardContent>
                </Card>
            ) : null}

            {employee ? (
                <>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                                    <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary ring-4 ring-primary/5">
                                        {avatarFallback}
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                                {employee.fullName}
                                            </h2>
                                            <StatusBadge
                                                label={
                                                    employeeStatusLabel[
                                                        employee.status
                                                    ]
                                                }
                                                tone={
                                                    employeeStatusTone[
                                                        employee.status
                                                    ]
                                                }
                                            />
                                        </div>
                                        <p className="mt-1 text-sm font-medium text-muted-foreground">
                                            {employee.position}
                                        </p>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Mã nhân viên:{" "}
                                            <span className="font-medium text-foreground">
                                                {employee.employeeCode}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                                    <Button
                                        type="button"
                                        className="w-full sm:w-auto"
                                        disabled={!id}
                                        onClick={() =>
                                            navigate(
                                                `/admin/employees/${id}/edit`,
                                            )
                                        }
                                    >
                                        <Pencil
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        Sửa thông tin
                                    </Button>
                                    <Button
                                        type="button"
                                        className="w-full sm:w-auto"
                                        variant={
                                            employee.status === "ACTIVE"
                                                ? "destructive"
                                                : "default"
                                        }
                                        disabled={
                                            updateEmployeeStatusMutation.isPending
                                        }
                                        onClick={() =>
                                            setIsStatusDialogOpen(true)
                                        }
                                    >
                                        {employee.status === "ACTIVE" ? (
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
                                        {employee.status === "ACTIVE"
                                            ? "Tạm ngưng nhân viên"
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
                                    Thông tin cá nhân
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="divide-y divide-border">
                                    <ProfileInformationField
                                        icon={Mail}
                                        label="Email"
                                    >
                                        <span className="break-all">
                                            {employee.email}
                                        </span>
                                    </ProfileInformationField>
                                    <ProfileInformationField
                                        icon={Phone}
                                        label="Số điện thoại"
                                    >
                                        {employee.phone}
                                    </ProfileInformationField>
                                    <ProfileInformationField
                                        icon={CalendarDays}
                                        label="Ngày vào làm"
                                    >
                                        {formatEmployeeDate(employee.joinedAt)}
                                    </ProfileInformationField>
                                </dl>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Thông tin công việc
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="divide-y divide-border">
                                    <ProfileInformationField
                                        icon={IdCard}
                                        label="Mã nhân viên"
                                    >
                                        {employee.employeeCode}
                                    </ProfileInformationField>
                                    <ProfileInformationField
                                        icon={Briefcase}
                                        label="Chức vụ"
                                    >
                                        {employee.position}
                                    </ProfileInformationField>
                                    <ProfileInformationField
                                        icon={CircleDot}
                                        label="Trạng thái"
                                    >
                                        <StatusBadge
                                            label={
                                                employeeStatusLabel[
                                                    employee.status
                                                ]
                                            }
                                            tone={
                                                employeeStatusTone[
                                                    employee.status
                                                ]
                                            }
                                        />
                                    </ProfileInformationField>
                                    <ProfileInformationField
                                        icon={CalendarPlus}
                                        label="Ngày tạo"
                                    >
                                        {formatEmployeeDate(employee.createdAt)}
                                    </ProfileInformationField>
                                    <ProfileInformationField
                                        icon={History}
                                        label="Ngày cập nhật"
                                    >
                                        {formatEmployeeDate(employee.updatedAt)}
                                    </ProfileInformationField>
                                </dl>
                            </CardContent>
                        </Card>
                    </div>

                    <ConfirmDialog
                        open={isStatusDialogOpen}
                        title="Xác nhận cập nhật trạng thái"
                        description="Bạn có chắc chắn muốn thực hiện hành động này?"
                        actionLabel={
                            employee.status === "ACTIVE"
                                ? "Tạm ngưng"
                                : "Kích hoạt lại"
                        }
                        variant={
                            employee.status === "ACTIVE"
                                ? "warning"
                                : "success"
                        }
                        isPending={
                            updateEmployeeStatusMutation.isPending
                        }
                        onOpenChange={setIsStatusDialogOpen}
                        onConfirm={() => void handleStatusUpdate()}
                    />
                </>
            ) : null}
        </section>
    );
}
