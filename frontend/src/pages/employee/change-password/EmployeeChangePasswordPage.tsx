import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import {
  useForm,
  type FieldError,
  type UseFormRegisterReturn,
} from 'react-hook-form'
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

type PasswordFieldProps = {
  id: string
  label: string
  autoComplete: string
  isVisible: boolean
  error?: FieldError
  registration: UseFormRegisterReturn
  onToggleVisibility: () => void
}

function PasswordField({
  id,
  label,
  autoComplete,
  isVisible,
  error,
  registration,
  onToggleVisibility,
}: PasswordFieldProps) {
  const ToggleIcon = isVisible ? EyeOff : Eye

  return (
    <div className="grid gap-2.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className="pr-10"
          {...registration}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
          onClick={onToggleVisibility}
          aria-label={isVisible ? `Ẩn ${label}` : `Hiện ${label}`}
        >
          <ToggleIcon className="size-4" aria-hidden="true" />
        </button>
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error.message}</p>
      ) : null}
    </div>
  )
}

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
  const [visibleFields, setVisibleFields] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })

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

  const togglePasswordVisibility = (field: keyof ChangePasswordFormValues) => {
    setVisibleFields((current) => ({
      ...current,
      [field]: !current[field],
    }))
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
            <PasswordField
              id="currentPassword"
              label="Mật khẩu hiện tại"
              autoComplete="current-password"
              isVisible={visibleFields.currentPassword}
              error={errors.currentPassword}
              registration={register('currentPassword')}
              onToggleVisibility={() =>
                togglePasswordVisibility('currentPassword')
              }
            />

            <PasswordField
              id="newPassword"
              label="Mật khẩu mới"
              autoComplete="new-password"
              isVisible={visibleFields.newPassword}
              error={errors.newPassword}
              registration={register('newPassword')}
              onToggleVisibility={() => togglePasswordVisibility('newPassword')}
            />

            <PasswordField
              id="confirmPassword"
              label="Xác nhận mật khẩu mới"
              autoComplete="new-password"
              isVisible={visibleFields.confirmPassword}
              error={errors.confirmPassword}
              registration={register('confirmPassword')}
              onToggleVisibility={() =>
                togglePasswordVisibility('confirmPassword')
              }
            />

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
