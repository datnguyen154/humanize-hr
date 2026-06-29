import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateEmployeeMutation } from "@/features/employee";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import type { ApiErrorResponse } from "@/shared/types";

const createEmployeeSchema = z.object({
    employeeCode: z.string().min(1, "Vui lòng nhập mã nhân viên"),
    fullName: z.string().min(1, "Vui lòng nhập họ tên"),
    email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
    phone: z.string().optional(),
    position: z.string().min(1, "Vui lòng nhập chức vụ"),
    status: z.enum(["ACTIVE", "INACTIVE"], {
        message: "Vui lòng chọn trạng thái",
    }),
    joinedAt: z.string().min(1, "Vui lòng chọn ngày vào làm"),
});

type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>;

const getCreateEmployeeErrorMessage = (error: unknown) => {
    if (error instanceof AxiosError) {
        const message = (error.response?.data as ApiErrorResponse | undefined)
            ?.message;

        return (
            message ??
            "Không thể tạo nhân viên. Vui lòng kiểm tra lại thông tin."
        );
    }

    return "Không thể tạo nhân viên. Vui lòng thử lại sau.";
};

export function CreateEmployeePage() {
    const navigate = useNavigate();
    const createEmployeeMutation = useCreateEmployeeMutation();
    const [formError, setFormError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CreateEmployeeFormValues>({
        resolver: zodResolver(createEmployeeSchema),
        defaultValues: {
            employeeCode: "",
            fullName: "",
            email: "",
            phone: "",
            position: "",
            status: "ACTIVE",
            joinedAt: "",
        },
    });

    const onSubmit = async (values: CreateEmployeeFormValues) => {
        setFormError(null);

        try {
            await createEmployeeMutation.mutateAsync({
                employeeCode: values.employeeCode,
                fullName: values.fullName,
                email: values.email,
                phone: values.phone?.trim() || undefined,
                position: values.position,
                status: values.status,
                joinedAt: new Date(
                    `${values.joinedAt}T00:00:00.000Z`,
                ).toISOString(),
            });

            showSuccessToast("Nhân viên mới đã được tạo.");
            navigate("/admin/employees");
        } catch (error) {
            setFormError(getCreateEmployeeErrorMessage(error));
            showErrorToast();
        }
    };

    return (
        <section className="grid gap-6">
            <div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="inline-flex mb-4 w-fit cursor-pointer items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => navigate("/admin/employees")}
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Quay lại danh sách
                </Button>

                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Thêm nhân viên
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Tạo hồ sơ nhân viên mới trong hệ thống.
                </p>
            </div>

            <Card className="overflow-hidden border-border shadow-sm">
                <CardHeader className="border-b border-border px-6 py-5">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <UserPlus className="size-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <CardTitle className="text-lg">
                                Thông tin nhân viên
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Điền thông tin cơ bản để tạo hồ sơ nhân viên
                                mới.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid gap-8 px-6 py-6">
                            {formError ? (
                                <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    {formError}
                                </p>
                            ) : null}

                            <section>
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold text-foreground">
                                        Thông tin cơ bản
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Thông tin nhận diện và liên hệ của nhân
                                        viên.
                                    </p>
                                </div>

                                <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="employeeCode">
                                            Mã nhân viên
                                        </Label>
                                        <Input
                                            id="employeeCode"
                                            placeholder="VD: EMP001"
                                            className="h-11"
                                            {...register("employeeCode")}
                                        />
                                        {errors.employeeCode ? (
                                            <p className="text-sm text-destructive">
                                                {errors.employeeCode.message}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="fullName">Họ tên</Label>
                                        <Input
                                            id="fullName"
                                            placeholder="Nhập họ tên nhân viên"
                                            className="h-11"
                                            {...register("fullName")}
                                        />
                                        {errors.fullName ? (
                                            <p className="text-sm text-destructive">
                                                {errors.fullName.message}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="nhanvien@example.com"
                                            className="h-11"
                                            {...register("email")}
                                        />
                                        {errors.email ? (
                                            <p className="text-sm text-destructive">
                                                {errors.email.message}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">
                                            Số điện thoại
                                        </Label>
                                        <Input
                                            id="phone"
                                            placeholder="Nhập số điện thoại"
                                            className="h-11"
                                            {...register("phone")}
                                        />
                                        {errors.phone ? (
                                            <p className="text-sm text-destructive">
                                                {errors.phone.message}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </section>

                            <section className="border-t border-border pt-6">
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold text-foreground">
                                        Thông tin công việc
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Thiết lập chức vụ, trạng thái và ngày
                                        bắt đầu làm việc.
                                    </p>
                                </div>

                                <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                                    <div className="grid gap-2 md:col-span-2">
                                        <Label htmlFor="position">
                                            Chức vụ
                                        </Label>
                                        <Input
                                            id="position"
                                            placeholder="Nhập chức vụ"
                                            className="h-11"
                                            {...register("position")}
                                        />
                                        {errors.position ? (
                                            <p className="text-sm text-destructive">
                                                {errors.position.message}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="status">
                                            Trạng thái
                                        </Label>
                                        <select
                                            id="status"
                                            className="h-11 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            {...register("status")}
                                        >
                                            <option value="ACTIVE">
                                                Đang làm việc
                                            </option>
                                            <option value="INACTIVE">
                                                Tạm ngưng
                                            </option>
                                        </select>
                                        {errors.status ? (
                                            <p className="text-sm text-destructive">
                                                {errors.status.message}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="joinedAt">
                                            Ngày vào làm
                                        </Label>
                                        <Input
                                            id="joinedAt"
                                            type="date"
                                            className="h-11"
                                            {...register("joinedAt")}
                                        />
                                        {errors.joinedAt ? (
                                            <p className="text-sm text-destructive">
                                                {errors.joinedAt.message}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/20 px-6 py-4 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/admin/employees")}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                className="min-w-[160px]"
                                disabled={createEmployeeMutation.isPending}
                            >
                                {createEmployeeMutation.isPending ? (
                                    <Loader2
                                        className="size-4 animate-spin"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <UserPlus
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                )}
                                {createEmployeeMutation.isPending
                                    ? "Đang tạo..."
                                    : "Tạo nhân viên"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </section>
    );
}
