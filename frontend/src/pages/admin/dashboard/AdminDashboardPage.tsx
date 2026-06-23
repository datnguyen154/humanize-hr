import {
    ArrowRight,
    Building2,
    ClipboardList,
    Clock3,
    Plus,
    Sparkles,
    Users,
    type LucideIcon,
} from "lucide-react";

import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardQueries } from "@/features/dashboard/hooks/useDashboardQueries";

type KpiCard = {
    label: string;
    value: string;
    icon: LucideIcon;
};

type QuickAction = {
    label: string;
    description: string;
    path: string;
    icon: LucideIcon;
};

type DashboardKpiValues = {
    totalEmployees: number;
    totalDepartments: number;
    totalLeaveRequests: number;
    totalAttendance: number;
};

const createKpiCards = ({
    totalEmployees,
    totalDepartments,
    totalLeaveRequests,
    totalAttendance,
}: DashboardKpiValues): KpiCard[] => [
    {
        label: "Tổng nhân viên",
        value: totalEmployees.toLocaleString("vi-VN"),
        icon: Users,
    },
    {
        label: "Tổng phòng ban",
        value: totalDepartments.toLocaleString("vi-VN"),
        icon: Building2,
    },
    {
        label: "Đơn nghỉ phép",
        value: totalLeaveRequests.toLocaleString("vi-VN"),
        icon: ClipboardList,
    },
    {
        label: "Chấm công hôm nay",
        value: totalAttendance.toLocaleString("vi-VN"),
        icon: Clock3,
    },
];

const quickActions: QuickAction[] = [
    {
        label: "Thêm nhân viên",
        description: "Tạo hồ sơ nhân viên mới.",
        path: "/admin/employees/create",
        icon: Users,
    },
    {
        label: "Tạo phòng ban",
        description: "Thêm phòng ban vào cơ cấu tổ chức.",
        path: "/admin/departments/create",
        icon: Building2,
    },
    {
        label: "Xem đơn nghỉ phép",
        description: "Theo dõi và xử lý yêu cầu nghỉ phép.",
        path: "/admin/leave-requests",
        icon: ClipboardList,
    },
    {
        label: "Xem chấm công",
        description: "Kiểm tra dữ liệu chấm công nhân viên.",
        path: "/admin/attendance",
        icon: Clock3,
    },
];

export function AdminDashboardPage() {
    const {
        employees,
        departments,
        attendance,
        leaveRequests,
        isLoading,
        isError,
    } = useDashboardQueries();

    const totalEmployees = employees.data?.meta.totalItems ?? 0;
    const totalDepartments = departments.data?.meta.totalItems ?? 0;
    const totalLeaveRequests = leaveRequests.data?.meta.totalItems ?? 0;
    const totalAttendance = attendance.data?.meta.totalItems ?? 0;

    const kpiCards = createKpiCards({
        totalEmployees,
        totalDepartments,
        totalLeaveRequests,
        totalAttendance,
    });

    return (
        <section className="grid gap-6">
            <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-primary/10 via-card to-card">
                <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                <Sparkles
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                Tổng quan hệ thống
                            </div>
                            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                                Chào mừng trở lại 👋
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                                Theo dõi tổng quan tình hình nhân sự và hoạt
                                động hệ thống.
                            </p>
                            {isError ? (
                                <p className="mt-3 text-sm font-medium text-destructive">
                                    Không thể tải dữ liệu bảng điều khiển
                                </p>
                            ) : null}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                {kpiCards.map((item) => {
                    const Icon = item.icon;

                    return (
                        <Card key={item.label}>
                            <CardContent className="flex items-center justify-between gap-4 p-5">
                                <div className="min-w-0">
                                    <p className="text-sm text-muted-foreground">
                                        {item.label}
                                    </p>
                                    {isLoading ? (
                                        <Skeleton className="mt-2 h-9 w-20" />
                                    ) : (
                                        <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                                            {item.value}
                                        </p>
                                    )}
                                </div>
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Icon
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Thao tác nhanh
                        </CardTitle>
                        <CardDescription>
                            Truy cập nhanh các nghiệp vụ quản trị thường dùng.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                        {quickActions.map((action) => {
                            const Icon = action.icon;

                            return (
                                <Button
                                    key={action.path}
                                    asChild
                                    variant="outline"
                                    className="h-auto justify-between gap-4 p-4 text-left"
                                >
                                    <Link to={action.path}>
                                        <span className="flex min-w-0 items-start gap-3">
                                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                                                <Icon
                                                    className="size-5"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-sm font-medium text-foreground">
                                                    {action.label}
                                                </span>
                                                <span className="mt-1 block whitespace-normal text-xs font-normal leading-relaxed text-muted-foreground">
                                                    {action.description}
                                                </span>
                                            </span>
                                        </span>
                                        <ArrowRight
                                            className="size-4 shrink-0 text-muted-foreground"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                </Button>
                            );
                        })}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Hoạt động gần đây
                        </CardTitle>
                        <CardDescription>
                            Các cập nhật mới nhất sẽ được hiển thị tại đây khi
                            hệ thống có dữ liệu.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-card text-muted-foreground">
                                    <Clock3
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground">
                                        Chưa có hoạt động mới
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Khi có API hoạt động gần đây, nội dung
                                        sẽ được cập nhật tại khu vực này.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-5 grid gap-3">
                                <Skeleton className="h-3 w-2/3" />
                                <Skeleton className="h-3 w-1/2" />
                                <Skeleton className="h-3 w-3/4" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Gợi ý vận hành</CardTitle>
                    <CardDescription>
                        Một vài bước cơ bản để hoàn thiện dữ liệu nhân sự trong
                        hệ thống.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-muted text-primary">
                            <Plus className="size-4" aria-hidden="true" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            Khởi tạo dữ liệu nhân sự
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Thêm nhân viên và phòng ban để bắt đầu quản lý.
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-muted text-primary">
                            <ClipboardList
                                className="size-4"
                                aria-hidden="true"
                            />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            Theo dõi nghỉ phép
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Kiểm tra trạng thái đơn nghỉ phép để xử lý kịp thời.
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-muted text-primary">
                            <Clock3 className="size-4" aria-hidden="true" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            Kiểm tra chấm công
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Theo dõi dữ liệu chấm công hằng ngày của nhân viên.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
