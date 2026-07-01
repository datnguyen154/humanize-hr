import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import {
    useForm,
    type FieldError,
    type UseFormRegisterReturn,
} from "react-hook-form";
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
import { useChangePasswordMutation } from "@/features/auth";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import type { ApiErrorResponse } from "@/shared/types";

const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
        newPassword: z
            .string()
            .min(1, "Vui lòng nhập mật khẩu mới")
            .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
        confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
        message: "Mật khẩu xác nhận không khớp",
        path: ["confirmPassword"],
    });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

type PasswordFieldProps = {
    id: string;
    label: string;
    placeholder: string;
    autoComplete: string;
    isVisible: boolean;
    error?: FieldError;
    registration: UseFormRegisterReturn;
    onToggleVisibility: () => void;
};

function PasswordField({
    id,
    label,
    placeholder,
    autoComplete,
    isVisible,
    error,
    registration,
    onToggleVisibility,
}: PasswordFieldProps) {
    const ToggleIcon = isVisible ? EyeOff : Eye;

    return (
        <div className="grid gap-2">
            <Label htmlFor={id} className="text-sm font-medium">
                {label}
            </Label>
            <div className="relative">
                <Input
                    id={id}
                    type={isVisible ? "text" : "password"}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className="h-10 pr-10"
                    {...registration}
                />
                <button
                    type="button"
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                    onClick={onToggleVisibility}
                    aria-label={isVisible ? `Ẩn ${label}` : `Hiện ${label}`}
                >
                    <ToggleIcon className="size-4" aria-hidden="true" />
                </button>
            </div>
            {error ? (
                <p className="text-sm text-destructive">{error.message}</p>
            ) : null}
        </div>
    );
}

const getChangePasswordErrorMessage = (error: unknown) => {
    if (error instanceof AxiosError) {
        const status = error.response?.status;
        const message = (error.response?.data as ApiErrorResponse | undefined)
            ?.message;
        const normalizedMessage = message?.toLowerCase() ?? "";

        if (
            status === 401 ||
            normalizedMessage.includes("unauthorized") ||
            normalizedMessage.includes("token")
        ) {
            return "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.";
        }

        if (
            normalizedMessage.includes("current password") ||
            normalizedMessage.includes("incorrect") ||
            normalizedMessage.includes("invalid password")
        ) {
            return "Mật khẩu hiện tại không đúng.";
        }

        if (
            normalizedMessage.includes("weak") ||
            normalizedMessage.includes("too weak") ||
            normalizedMessage.includes("password too weak")
        ) {
            return "Mật khẩu mới chưa đủ mạnh.";
        }

        return message ?? "Không thể đổi mật khẩu. Vui lòng thử lại.";
    }

    return "Không thể đổi mật khẩu. Vui lòng thử lại.";
};

export function EmployeeChangePasswordPage() {
    const changePasswordMutation = useChangePasswordMutation();
    const [visibleFields, setVisibleFields] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isValid },
    } = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(changePasswordSchema),
        mode: "onChange",
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: ChangePasswordFormValues) => {
        try {
            await changePasswordMutation.mutateAsync(values);
            showSuccessToast("Mật khẩu của bạn đã được cập nhật.");
            reset();
        } catch (error) {
            showErrorToast(
                getChangePasswordErrorMessage(error),
                "Đổi mật khẩu thất bại",
            );
        }
    };

    const togglePasswordVisibility = (
        field: keyof ChangePasswordFormValues,
    ) => {
        setVisibleFields((current) => ({
            ...current,
            [field]: !current[field],
        }));
    };

    return (
        <section className="mx-auto w-full max-w-xl">
            <Card className="border-border shadow-sm">
                <CardHeader className="gap-1.5 border-b border-border">
                    <CardTitle className="text-xl">Đổi mật khẩu</CardTitle>
                    <CardDescription>
                        Cập nhật mật khẩu định kỳ để bảo vệ tài khoản của bạn.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="mb-6 flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
                            <ShieldCheck
                                className="size-5"
                                aria-hidden="true"
                            />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-foreground">
                                Bảo mật tài khoản
                            </h3>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                Không chia sẻ mật khẩu với bất kỳ ai. Hãy sử
                                dụng mật khẩu mạnh và khác với mật khẩu cũ.
                            </p>
                        </div>
                    </div>

                    <form
                        className="grid gap-6"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <PasswordField
                            id="currentPassword"
                            label="Mật khẩu hiện tại"
                            placeholder="Nhập mật khẩu hiện tại"
                            autoComplete="current-password"
                            isVisible={visibleFields.currentPassword}
                            error={errors.currentPassword}
                            registration={register("currentPassword")}
                            onToggleVisibility={() =>
                                togglePasswordVisibility("currentPassword")
                            }
                        />

                        <PasswordField
                            id="newPassword"
                            label="Mật khẩu mới"
                            placeholder="Nhập mật khẩu mới"
                            autoComplete="new-password"
                            isVisible={visibleFields.newPassword}
                            error={errors.newPassword}
                            registration={register("newPassword")}
                            onToggleVisibility={() =>
                                togglePasswordVisibility("newPassword")
                            }
                        />

                        <PasswordField
                            id="confirmPassword"
                            label="Xác nhận mật khẩu mới"
                            placeholder="Nhập lại mật khẩu mới"
                            autoComplete="new-password"
                            isVisible={visibleFields.confirmPassword}
                            error={errors.confirmPassword}
                            registration={register("confirmPassword")}
                            onToggleVisibility={() =>
                                togglePasswordVisibility("confirmPassword")
                            }
                        />

                        <p className="text-sm text-muted-foreground">
                            Mật khẩu mới nên có ít nhất 8 ký tự và khác mật khẩu
                            hiện tại.
                        </p>

                        <div className="flex justify-end border-t border-border pt-6">
                            <Button
                                type="submit"
                                className="min-w-[190px]"
                                disabled={
                                    changePasswordMutation.isPending || !isValid
                                }
                            >
                                {changePasswordMutation.isPending ? (
                                    <>
                                        <Loader2
                                            className="size-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                        Đang cập nhật...
                                    </>
                                ) : (
                                    "Cập nhật mật khẩu"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </section>
    );
}
