export { changePassword, getMe, login } from './api/auth.api'
export { getDashboardPathByRole } from './lib/get-dashboard-path-by-role'
export { useChangePasswordMutation } from './hooks/useChangePasswordMutation'
export { authStorage } from './model/auth.storage'
export { useAuthStore } from './model/auth.store'
export type {
  AuthUser,
  ChangePasswordRequest,
  ChangePasswordResponse,
  GetMeResponse,
  LoginRequest,
  LoginResponse,
  UserRole,
} from './types/auth.types'
