import {
    ArrowRight,
    Building2,
    ClipboardList,
    Clock3,
    Sparkles,
    Users,
    type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { AttendanceRecord } from "@/features/attendance/types/attendance.types";
import {
    DashboardActivitySkeleton,
    DashboardChartSkeleton,
    DashboardKPISkeleton,
} from "@/features/dashboard/components/DashboardLoadingSkeletons";
import { useDashboardQueries } from "@/features/dashboard/hooks/useDashboardQueries";
import { mapDashboardActivities } from "@/features/dashboard/lib/dashboard-activity.mapper";
import type { DashboardActivityType } from "@/features/dashboard/types/dashboard.types";

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

type AttendanceTrendItem = {
    dateKey: string;
    dateLabel: string;
    total: number;
    present: number;
    late: number;
};

const attendanceDateFormatter = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Bangkok",
});

const activityTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
});

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

const formatAttendanceDateLabel = (date: string) =>
    attendanceDateFormatter.format(new Date(date));

const buildAttendanceTrendData = (
    records: AttendanceRecord[],
): AttendanceTrendItem[] => {
    const groupedRecords = new Map<string, AttendanceTrendItem>();

    records.forEach((record) => {
        const dateKey = record.attendanceDate.slice(0, 10);
        const existingItem = groupedRecords.get(dateKey) ?? {
            dateKey,
            dateLabel: formatAttendanceDateLabel(record.attendanceDate),
            total: 0,
            present: 0,
            late: 0,
        };

        existingItem.total += 1;

        if (record.status === "PRESENT") {
            existingItem.present += 1;
        }

        if (record.status === "LATE") {
            existingItem.late += 1;
        }

        groupedRecords.set(dateKey, existingItem);
    });

    return Array.from(groupedRecords.values()).sort((a, b) =>
        a.dateKey.localeCompare(b.dateKey),
    );
};

const attendanceChartLabels: Record<string, string> = {
    total: "Tổng lượt",
    present: "Đúng giờ",
    late: "Đi muộn",
};

const activityIconMap: Record<DashboardActivityType, LucideIcon> = {
    attendance: Clock3,
    "leave-request": ClipboardList,
    department: Building2,
};

const formatActivityTime = (date: string) =>
    activityTimeFormatter.format(new Date(date));

export function AdminDashboardPage() {
    const {
        employees,
        departments,
        attendance,
        leaveRequests,
        isLoading,
        isError,
    } = useDashboardQueries();
    const employeeData = employees.data;
    const departmentData = departments.data;
    const attendanceData = attendance.data;
    const leaveRequestData = leaveRequests.data;
    const isRetrying =
        employees.isFetching ||
        departments.isFetching ||
        attendance.isFetching ||
        leaveRequests.isFetching;

    const totalEmployees = employeeData?.meta.totalItems ?? 0;
    const totalDepartments = departmentData?.meta.totalItems ?? 0;
    const totalLeaveRequests = leaveRequestData?.meta.totalItems ?? 0;
    const totalAttendance = attendanceData?.meta.totalItems ?? 0;
    const attendanceTrendData = useMemo(
        () => buildAttendanceTrendData(attendanceData?.data ?? []),
        [attendanceData?.data],
    );
    const recentActivities = useMemo(
        () =>
            mapDashboardActivities({
                attendanceRecords: attendanceData?.data ?? [],
                leaveRequests: leaveRequestData?.data ?? [],
                departments: departmentData?.data ?? [],
            }),
        [attendanceData?.data, departmentData?.data, leaveRequestData?.data],
    );

    const kpiCards = createKpiCards({
        totalEmployees,
        totalDepartments,
        totalLeaveRequests,
        totalAttendance,
    });

    const handleRetryDashboardQueries = () => {
        void Promise.all([
            employees.refetch(),
            departments.refetch(),
            attendance.refetch(),
            leaveRequests.refetch(),
        ]);
    };

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
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isError ? (
                <Card className="border-destructive/30">
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium text-destructive">
                            Không thể tải dữ liệu dashboard
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleRetryDashboardQueries}
                            disabled={isRetrying}
                        >
                            Thử lại
                        </Button>
                    </CardContent>
                </Card>
            ) : null}

            {isLoading ? (
                <DashboardKPISkeleton />
            ) : (
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
                                        <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                                            {item.value}
                                        </p>
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
            )}

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
                            Xu hướng chấm công
                        </CardTitle>
                        <CardDescription>
                            Tổng hợp lượt chấm công đúng giờ và đi muộn theo
                            ngày.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <DashboardChartSkeleton />
                        ) : attendanceTrendData.length > 0 ? (
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={attendanceTrendData}
                                        margin={{
                                            top: 8,
                                            right: 8,
                                            left: -16,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            stroke="var(--border)"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="dateLabel"
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fill: "var(--muted-foreground)",
                                                fontSize: 12,
                                            }}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{
                                                fill: "var(--muted-foreground)",
                                                fontSize: 12,
                                            }}
                                        />
                                        <Tooltip
                                            cursor={{
                                                fill: "var(--muted)",
                                            }}
                                            formatter={(value, name) => [
                                                value,
                                                attendanceChartLabels[
                                                    String(name)
                                                ] ?? name,
                                            ]}
                                            labelFormatter={(label) =>
                                                `Ngày ${label}`
                                            }
                                        />
                                        <Legend
                                            formatter={(value) =>
                                                attendanceChartLabels[
                                                    String(value)
                                                ] ?? value
                                            }
                                        />
                                        <Bar
                                            dataKey="total"
                                            fill="var(--secondary)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="present"
                                            fill="var(--primary)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="late"
                                            fill="var(--destructive)"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-5 text-center text-sm text-muted-foreground">
                                Chưa có dữ liệu chấm công
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Hoạt động gần đây</CardTitle>
                    <CardDescription>
                        Các cập nhật mới nhất từ chấm công, nghỉ phép và phòng
                        ban.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <DashboardActivitySkeleton />
                    ) : recentActivities.length > 0 ? (
                        <div className="grid gap-3">
                            {recentActivities.map((activity) => {
                                const ActivityIcon =
                                    activityIconMap[activity.type];

                                return (
                                    <div
                                        key={activity.id}
                                        className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                                    >
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                                            <ActivityIcon
                                                className="size-5"
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-foreground">
                                                {activity.message}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {formatActivityTime(
                                                    activity.createdAt,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-5 text-center text-sm text-muted-foreground">
                            Chưa có hoạt động nào
                        </div>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}
