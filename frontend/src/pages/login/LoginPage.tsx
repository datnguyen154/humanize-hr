import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { ArrowRight, Building2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authStorage, getMe, login, useAuthStore } from "@/features/auth";
import type { ApiErrorResponse } from "@/shared/types";

const loginSchema = z.object({
    email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
    password: z
        .string()
        .min(1, "Vui lòng nhập mật khẩu")
        .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const AUTH_ERROR_MESSAGES: Record<string, string> = {
    "Invalid email or password": "Email hoặc mật khẩu không đúng.",
    Unauthorized: "Phiên đăng nhập không hợp lệ.",
    "Token expired": "Phiên đăng nhập đã hết hạn.",
    Forbidden: "Bạn không có quyền truy cập.",
    "Account is inactive": "Tài khoản đã bị khóa.",
};

const getLoginErrorMessage = (error: unknown) => {
    if (error instanceof AxiosError) {
        const message = (error.response?.data as ApiErrorResponse | undefined)
            ?.message;

        return message
            ? (AUTH_ERROR_MESSAGES[message] ??
                  "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.")
            : "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
    }

    return "Đăng nhập thất bại. Vui lòng thử lại sau.";
};

export function LoginPage() {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const setUser = useAuthStore((state) => state.setUser);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values: LoginFormValues) => {
        setLoginError(null);

        try {
            const authData = await login(values);

            authStorage.setTokens({
                accessToken: authData.accessToken,
                refreshToken: authData.refreshToken,
            });

            const user = await getMe();

            setUser(user);
            console.log("Thông tin người dùng:", user);
            navigate("/dashboard");
        } catch (error) {
            setLoginError(getLoginErrorMessage(error));
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
            <Card className="w-full max-w-[440px] overflow-hidden border-border border-t-4 border-t-primary shadow-xl shadow-secondary/15">
                <CardHeader className="items-center px-8 pt-9 pb-6 text-center">
                    <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
                        <Building2 className="size-7" aria-hidden="true" />
                    </div>
                    <CardTitle
                        id="login-title"
                        className="text-3xl font-bold tracking-normal text-foreground"
                    >
                        Humanize HR
                    </CardTitle>
                    <CardDescription className="mt-2 text-balance text-sm leading-6 text-muted-foreground">
                        Đăng nhập vào không gian làm việc của doanh nghiệp
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-8 pb-6">
                    <form
                        className="grid gap-5"
                        aria-labelledby="login-title"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        {loginError ? (
                            <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {loginError}
                            </p>
                        ) : null}

                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-foreground">
                                Địa chỉ email
                            </Label>
                            <div className="relative">
                                <Mail
                                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                                    aria-hidden="true"
                                />
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="admin@example.com"
                                    aria-invalid={
                                        errors.email ? "true" : "false"
                                    }
                                    className="h-11 rounded-lg border-input bg-background pl-10 text-foreground shadow-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                                    {...register("email")}
                                    tabIndex={1}
                                />
                            </div>
                            {errors.email ? (
                                <p className="text-sm text-destructive">
                                    {errors.email.message}
                                </p>
                            ) : null}
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between gap-3">
                                <Label
                                    htmlFor="password"
                                    className="text-foreground"
                                >
                                    Mật khẩu
                                </Label>
                                <a
                                    href="#"
                                    className="text-sm font-medium text-primary hover:text-primary/80 hover:underline"
                                >
                                    Quên mật khẩu?
                                </a>
                            </div>
                            <div className="relative">
                                <Lock
                                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                                    aria-hidden="true"
                                />
                                <Input
                                    id="password"
                                    type={
                                        isPasswordVisible ? "text" : "password"
                                    }
                                    autoComplete="current-password"
                                    placeholder="Nhập mật khẩu của bạn"
                                    aria-invalid={
                                        errors.password ? "true" : "false"
                                    }
                                    className="h-11 rounded-lg border-input bg-background pr-11 pl-10 text-foreground shadow-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                                    {...register("password")}
                                    tabIndex={2}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1/2 right-1 size-9 -translate-y-1/2 rounded-md text-muted-foreground hover:bg-transparent hover:text-foreground"
                                    aria-label={
                                        isPasswordVisible
                                            ? "Ẩn mật khẩu"
                                            : "Hiện mật khẩu"
                                    }
                                    onClick={() =>
                                        setIsPasswordVisible(
                                            (current) => !current,
                                        )
                                    }
                                >
                                    {isPasswordVisible ? (
                                        <EyeOff
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <Eye
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    )}
                                </Button>
                            </div>
                            {errors.password ? (
                                <p className="text-sm text-destructive">
                                    {errors.password.message}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox id="remember-me" />
                            <Label
                                htmlFor="remember-me"
                                className="cursor-pointer text-sm font-normal text-muted-foreground"
                            >
                                Ghi nhớ đăng nhập
                            </Label>
                        </div>

                        <Button
                            className="mt-1 h-11 rounded-lg font-semibold shadow-sm"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex-col gap-1 border-t border-border bg-muted/60 px-8 py-5 text-center text-sm text-muted-foreground">
                    <p>Cần hỗ trợ truy cập tài khoản?</p>
                    <a
                        href="mailto:it-support@example.com"
                        className="font-medium text-primary hover:text-primary/80 hover:underline"
                    >
                        Liên hệ hỗ trợ IT.
                    </a>
                </CardFooter>
            </Card>
        </main>
    );
}
