export const DEMO_ACCOUNTS = {
  ADMIN: {
    label: 'Dùng tài khoản Admin',
    email: 'admin@example.com',
    password: '12345678',
  },
  EMPLOYEE: {
    label: 'Dùng tài khoản Employee',
    email: 'employee@example.com',
    password: 'Employee@123',
  },
} as const

export type DemoAccountKey = keyof typeof DEMO_ACCOUNTS
