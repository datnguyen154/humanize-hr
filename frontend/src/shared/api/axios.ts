import axios from 'axios'

import { env } from '../lib/env'

export const axiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})
