import { axiosInstance } from '../../../shared/api'
import type { ApiResponse } from '../../../shared/types'
import { authStorage } from '../model/auth.storage'
import type { AuthUser, LoginRequest, LoginResponse } from '../types/auth.types'

export const login = async (payload: LoginRequest) => {
  const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
    '/auth/login',
    payload,
  )

  return response.data.data
}

export const getMe = async () => {
  const accessToken = authStorage.getAccessToken()

  const response = await axiosInstance.get<ApiResponse<AuthUser>>('/auth/me', {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  })

  return response.data.data
}
