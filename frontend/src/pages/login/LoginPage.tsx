import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Building2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
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

const loginSchema = z.object({
    email: z.string().min(1, "Email is required").email("Email must be valid"),
    password: z
        .string()
        .min(1, "Password is required")
        .min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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

    const onSubmit = () => {
        return undefined;
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
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-foreground">
                                Địa chỉ Email
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
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1/2 right-1 size-9 -translate-y-1/2 rounded-md text-muted-foreground hover:bg-transparent hover:text-foreground"
                                    aria-label={
                                        isPasswordVisible
                                            ? "Hide password"
                                            : "Show password"
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
                            Đăng nhập
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
