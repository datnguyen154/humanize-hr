const ACCESS_TOKEN_KEY = 'hrm_access_token'
const REFRESH_TOKEN_KEY = 'hrm_refresh_token'

const storage = () => window.localStorage

export const authStorage = {
  getAccessToken: () => storage().getItem(ACCESS_TOKEN_KEY),

  getRefreshToken: () => storage().getItem(REFRESH_TOKEN_KEY),

  setAccessToken: (token: string) => {
    storage().setItem(ACCESS_TOKEN_KEY, token)
  },

  setRefreshToken: (token: string) => {
    storage().setItem(REFRESH_TOKEN_KEY, token)
  },

  setTokens: (tokens: { accessToken: string; refreshToken: string }) => {
    storage().setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    storage().setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  },

  clearTokens: () => {
    storage().removeItem(ACCESS_TOKEN_KEY)
    storage().removeItem(REFRESH_TOKEN_KEY)
  },
}
