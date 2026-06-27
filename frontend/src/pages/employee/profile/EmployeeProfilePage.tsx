import { AxiosError } from 'axios'
import {
  Briefcase,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleDot,
  IdCard,
  Mail,
  Phone,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DetailPageSkeleton } from '@/components/ui/skeleton'
import {
  StatusBadge,
  type StatusBadgeTone,
} from '@/components/ui/status-badge'
import {
  employeeStatusLabel,
  formatEmployeeDate,
  useMyEmployeeProfileQuery,
  type EmployeeStatus,
} from '@/features/employee'

const employeeStatusTone: Record<EmployeeStatus, StatusBadgeTone> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
}

type ProfileFieldProps = {
  icon: LucideIcon
  label: string
  children: ReactNode
}

function ProfileField({ icon: Icon, label, children }: ProfileFieldProps) {
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
  )
}

const getProfileErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError && error.response?.status === 404) {
    return 'Chưa tìm thấy hồ sơ nhân viên được liên kết với tài khoản này.'
  }

  return 'Không thể tải hồ sơ cá nhân.'
}

const getAvatarFallback = (fullName: string) => {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return initials || 'NV'
}

export function EmployeeProfilePage() {
  const profileQuery = useMyEmployeeProfileQuery()
  const profile = profileQuery.data

  return (
    <section className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Hồ sơ cá nhân
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Xem thông tin cá nhân và công việc của bạn trong hệ thống.
        </p>
      </div>

      {profileQuery.isLoading ? (
        <DetailPageSkeleton fieldsPerCard={3} />
      ) : null}

      {profileQuery.isError ? (
        <Card className="border-border shadow-sm">
          <CardContent className="py-12 text-center text-destructive">
            {getProfileErrorMessage(profileQuery.error)}
          </CardContent>
        </Card>
      ) : null}

      {profile ? (
        <>
          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary ring-4 ring-primary/5">
                  {getAvatarFallback(profile.fullName)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                      {profile.fullName || 'Chưa cập nhật'}
                    </h3>
                    <StatusBadge
                      label={employeeStatusLabel[profile.status]}
                      tone={employeeStatusTone[profile.status]}
                    />
                  </div>

                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {profile.position || 'Chưa cập nhật'}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span>
                      Mã nhân viên:{' '}
                      <span className="font-medium text-foreground">
                        {profile.employeeCode || 'Chưa cập nhật'}
                      </span>
                    </span>
                    <span>
                      Phòng ban:{' '}
                      <span className="font-medium text-foreground">
                        {profile.department?.name || 'Chưa cập nhật'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-border">
                  <ProfileField icon={Mail} label="Email">
                    <span className="break-all">
                      {profile.email || 'Chưa cập nhật'}
                    </span>
                  </ProfileField>
                  <ProfileField icon={Phone} label="Số điện thoại">
                    {profile.phone || 'Chưa cập nhật'}
                  </ProfileField>
                </dl>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Thông tin công việc</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-border">
                  <ProfileField icon={IdCard} label="Mã nhân viên">
                    {profile.employeeCode || 'Chưa cập nhật'}
                  </ProfileField>
                  <ProfileField icon={Building2} label="Phòng ban">
                    {profile.department?.name || 'Chưa cập nhật'}
                  </ProfileField>
                  <ProfileField icon={Briefcase} label="Chức vụ">
                    {profile.position || 'Chưa cập nhật'}
                  </ProfileField>
                  <ProfileField icon={CalendarDays} label="Ngày vào làm">
                    {profile.joinedAt
                      ? formatEmployeeDate(profile.joinedAt)
                      : 'Chưa cập nhật'}
                  </ProfileField>
                  <ProfileField icon={CircleDot} label="Trạng thái">
                    <StatusBadge
                      label={employeeStatusLabel[profile.status]}
                      tone={employeeStatusTone[profile.status]}
                    />
                  </ProfileField>
                </dl>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                    <ShieldCheck className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground">
                      Bảo mật tài khoản
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Quản lý mật khẩu và bảo vệ tài khoản nhân viên của bạn.
                    </p>
                  </div>
                </div>

                <Button
                  asChild
                  type="button"
                  variant="outline"
                  className="w-full shrink-0 sm:w-auto"
                >
                  <Link to="/employee/change-password">
                    Đổi mật khẩu
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">
            Liên hệ bộ phận nhân sự nếu thông tin của bạn chưa chính xác.
          </p>
        </>
      ) : null}
    </section>
  )
}
