export { getMe, login } from './api/auth.api'
export { getDashboardPathByRole } from './lib/get-dashboard-path-by-role'
export { authStorage } from './model/auth.storage'
export { useAuthStore } from './model/auth.store'
export type {
  AuthUser,
  GetMeResponse,
  LoginRequest,
  LoginResponse,
  UserRole,
} from './types/auth.types'
