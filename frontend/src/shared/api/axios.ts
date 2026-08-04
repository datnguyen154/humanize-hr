import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'

import { authStorage } from '@/features/auth/model/auth.storage'
import { useAuthStore } from '@/features/auth/model/auth.store'
import { showSessionExpiredToast } from '@/lib/toast'

import { env } from '../lib/env'

export const axiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

const refreshTokenClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

type RefreshTokenResponse = {
  data: {
    accessToken: string
  }
}

let refreshPromise: Promise<string> | null = null

const isExcludedAuthRequest = (url?: string) =>
  Boolean(
    url?.includes('/auth/login') || url?.includes('/auth/refresh-token'),
  )

const isFormDataPayload = (data: unknown): data is FormData =>
  typeof FormData !== 'undefined' && data instanceof FormData

const requestNewAccessToken = () => {
  if (!refreshPromise) {
    const refreshToken = authStorage.getRefreshToken()

    if (!refreshToken) {
      return Promise.reject(new Error('Refresh token is missing'))
    }

    refreshPromise = refreshTokenClient
      .post<RefreshTokenResponse>('/auth/refresh-token', { refreshToken })
      .then((response) => {
        const accessToken = response.data.data.accessToken

        if (!accessToken) {
          throw new Error('Access token is missing from refresh response')
        }

        return accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

const redirectToLogin = () => {
  delete axiosInstance.defaults.headers.common.Authorization
  useAuthStore.getState().logout()
  showSessionExpiredToast()

  if (window.location.pathname !== '/login') {
    window.history.replaceState(window.history.state, '', '/login')
    window.dispatchEvent(
      new PopStateEvent('popstate', { state: window.history.state }),
    )
  }
}

axiosInstance.interceptors.request.use((config) => {
  if (isFormDataPayload(config.data)) {
    config.headers.delete('Content-Type')
    config.headers.delete('content-type')
  }

  if (isExcludedAuthRequest(config.url)) {
    config.headers.delete('Authorization')
    return config
  }

  const accessToken = authStorage.getAccessToken()

  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  } else {
    config.headers.delete('Authorization')
  }

  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      isExcludedAuthRequest(originalRequest.url)
    ) {
      return Promise.reject(error)
    }

    if (originalRequest._retry) {
      redirectToLogin()
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const accessToken = await requestNewAccessToken()

      authStorage.setAccessToken(accessToken)
      axiosInstance.defaults.headers.common.Authorization =
        `Bearer ${accessToken}`
      originalRequest.headers.set('Authorization', `Bearer ${accessToken}`)

      return axiosInstance(originalRequest)
    } catch (refreshError) {
      redirectToLogin()
      return Promise.reject(refreshError)
    }
  },
)
