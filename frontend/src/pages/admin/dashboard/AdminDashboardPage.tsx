import {
    ArrowRight,
    Building2,
    ClipboardList,
    Clock3,
    RefreshCw,
    Sparkles,
    Users,
    type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import {
    DashboardActivitySkeleton,
    DashboardChartSkeleton,
    DashboardKPISkeleton,
} from "@/features/dashboard/components/DashboardLoadingSkeletons";
import { useAdminDashboardQuery } from "@/features/dashboard/hooks/useAdminDashboardQuery";
import { ADMIN_DASHBOARD_PERIODS, DEFAULT_ADMIN_DASHBOARD_DAYS, formatDashboardDate } from "@/features/dashboard/lib/admin-dashboard.config";
import { mapDashboardActivities } from "@/features/dashboard/lib/dashboard-activity.mapper";
import type { AdminDashboardDays, AdminDashboardSummary, DashboardActivityType } from "@/features/dashboard/types/dashboard.types";

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

const kpiDefinitions: { key: keyof AdminDashboardSummary; label: string; icon: LucideIcon }[] = [
    {
        label: "Tổng nhân viên",
        key: "totalEmployees",
        icon: Users,
    },
    {
        label: "Tổng phòng ban",
        key: "totalDepartments",
        icon: Building2,
    },
    {
        label: "Đơn nghỉ phép",
        key: "totalLeaveRequests",
        icon: ClipboardList,
    },
    {
        label: "Chấm công hôm nay",
        key: "todayAttendance",
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
    const [days, setDays] = useState<AdminDashboardDays>(DEFAULT_ADMIN_DASHBOARD_DAYS);
    const { data, isLoading, isError, isFetching, refetch } = useAdminDashboardQuery(days);
    const attendanceTrendData = data?.attendanceTrend ?? [];
    const recentActivities = useMemo(
        () =>
            mapDashboardActivities(data?.recentActivities ?? []),
        [data?.recentActivities],
    );

    const kpiCards: KpiCard[] = kpiDefinitions.map(({ key, ...item }) => ({
        ...item,
        value: data?.summary[key].toLocaleString("vi-VN") ?? "--",
    }));

    const handleRetryDashboardQueries = () => {
        void refetch();
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
                        <Button variant="outline" onClick={handleRetryDashboardQueries} disabled={isFetching}>
                            <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />
                            Làm mới
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isError ? (
                <Card className="border-destructive/30">
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium text-destructive">
                            Không thể tải dữ liệu dashboard
                            {data ? " · Đang hiển thị dữ liệu tải trước đó." : ""}
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleRetryDashboardQueries}
                            disabled={isFetching}
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
                            {data ? ` ${formatDashboardDate(data.period.fromDate)} - ${formatDashboardDate(data.period.toDate)}` : ""}
                        </CardDescription>
                        <select
                            aria-label="Khoảng thời gian chấm công"
                            value={days}
                            onChange={(event) => {
                                const period = ADMIN_DASHBOARD_PERIODS.find((item) => String(item.value) === event.target.value);
                                if (period) setDays(period.value);
                            }}
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
                        >
                            {ADMIN_DASHBOARD_PERIODS.map((period) => <option key={period.value} value={period.value}>{period.label}</option>)}
                        </select>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <DashboardChartSkeleton />
                        ) : attendanceTrendData.some((point) => point.total > 0) ? (
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
                                            dataKey="date"
                                            tickFormatter={formatAttendanceDateLabel}
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
                                                `Ngày ${formatDashboardDate(String(label))}`
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
                                {isError && !data ? "Chưa tải được dữ liệu chấm công" : "Chưa có dữ liệu chấm công"}
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
                            {isError && !data ? "Chưa tải được hoạt động gần đây" : "Chưa có hoạt động nào"}
                        </div>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}
