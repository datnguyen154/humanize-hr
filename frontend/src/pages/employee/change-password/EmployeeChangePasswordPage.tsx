import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useChangePasswordMutation } from '@/features/auth'
import { showErrorToast, showSuccessToast } from '@/lib/toast'
import type { ApiErrorResponse } from '@/shared/types'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu mới')
      .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

const getChangePasswordErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const status = error.response?.status
    const message = (error.response?.data as ApiErrorResponse | undefined)
      ?.message
    const normalizedMessage = message?.toLowerCase() ?? ''

    if (
      status === 401 ||
      normalizedMessage.includes('unauthorized') ||
      normalizedMessage.includes('token')
    ) {
      return 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.'
    }

    if (
      normalizedMessage.includes('current password') ||
      normalizedMessage.includes('incorrect') ||
      normalizedMessage.includes('invalid password')
    ) {
      return 'Mật khẩu hiện tại không đúng.'
    }

    if (
      normalizedMessage.includes('weak') ||
      normalizedMessage.includes('too weak') ||
      normalizedMessage.includes('password too weak')
    ) {
      return 'Mật khẩu mới chưa đủ mạnh.'
    }

    return message ?? 'Không thể đổi mật khẩu. Vui lòng thử lại.'
  }

  return 'Không thể đổi mật khẩu. Vui lòng thử lại.'
}

export function EmployeeChangePasswordPage() {
  const changePasswordMutation = useChangePasswordMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      await changePasswordMutation.mutateAsync(values)
      showSuccessToast('Mật khẩu của bạn đã được cập nhật.')
      reset()
    } catch (error) {
      showErrorToast(getChangePasswordErrorMessage(error), 'Đổi mật khẩu thất bại')
    }
  }

  return (
    <section className="mx-auto w-full max-w-2xl">
      <Card>
        <CardHeader className="gap-1.5 border-b border-border">
          <CardTitle className="text-lg">Đổi mật khẩu</CardTitle>
          <CardDescription>
            Cập nhật mật khẩu đăng nhập cho tài khoản của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-2.5">
              <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                {...register('currentPassword')}
              />
              {errors.currentPassword ? (
                <p className="text-xs text-destructive">
                  {errors.currentPassword.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2.5">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                {...register('newPassword')}
              />
              {errors.newPassword ? (
                <p className="text-xs text-destructive">
                  {errors.newPassword.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2.5">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword ? (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end border-t border-border pt-5">
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending
                  ? 'Đang đổi mật khẩu...'
                  : 'Đổi mật khẩu'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
