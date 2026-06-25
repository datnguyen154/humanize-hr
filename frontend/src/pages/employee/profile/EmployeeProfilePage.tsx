import { AxiosError } from 'axios'
import {
  Briefcase,
  Building2,
  CalendarDays,
  CircleDot,
  IdCard,
  Mail,
  Phone,
  User,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    return 'Chưa tìm thấy hồ sơ nhân viên được liên kết với tài khoản này'
  }

  return 'Không thể tải hồ sơ cá nhân'
}

export function EmployeeProfilePage() {
  const profileQuery = useMyEmployeeProfileQuery()
  const profile = profileQuery.data

  return (
    <section className="grid gap-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Hồ sơ cá nhân</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Thông tin nhân viên được liên kết với tài khoản của bạn.
        </p>
      </div>

      {profileQuery.isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Đang tải hồ sơ cá nhân...
          </CardContent>
        </Card>
      ) : null}

      {profileQuery.isError ? (
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            {getProfileErrorMessage(profileQuery.error)}
          </CardContent>
        </Card>
      ) : null}

      {profile ? (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                  <User className="size-7" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {profile.fullName}
                    </h3>
                    <StatusBadge
                      label={employeeStatusLabel[profile.status]}
                      tone={employeeStatusTone[profile.status]}
                    />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {profile.position}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin hồ sơ</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border">
                <ProfileField icon={IdCard} label="Mã nhân viên">
                  {profile.employeeCode}
                </ProfileField>
                <ProfileField icon={User} label="Họ tên">
                  {profile.fullName}
                </ProfileField>
                <ProfileField icon={Mail} label="Email">
                  <span className="break-all">{profile.email}</span>
                </ProfileField>
                <ProfileField icon={Phone} label="Số điện thoại">
                  {profile.phone || 'Chưa cập nhật'}
                </ProfileField>
                <ProfileField icon={Building2} label="Phòng ban">
                  {profile.department?.name ?? 'Chưa cập nhật'}
                </ProfileField>
                <ProfileField icon={Briefcase} label="Chức vụ">
                  {profile.position}
                </ProfileField>
                <ProfileField icon={CircleDot} label="Trạng thái">
                  <StatusBadge
                    label={employeeStatusLabel[profile.status]}
                    tone={employeeStatusTone[profile.status]}
                  />
                </ProfileField>
                <ProfileField icon={CalendarDays} label="Ngày vào làm">
                  {formatEmployeeDate(profile.joinedAt)}
                </ProfileField>
              </dl>
            </CardContent>
          </Card>
        </>
      ) : null}
    </section>
  )
}
