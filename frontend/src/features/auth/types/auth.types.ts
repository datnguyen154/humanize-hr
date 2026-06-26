export type UserRole = 'ADMIN' | 'EMPLOYEE'

export type AuthUser = {
  id: string
  email: string
  fullName: string
  role: UserRole
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export type GetMeResponse = AuthUser

export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type ChangePasswordResponse = {
  message?: string
}
