import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'

import './LoginPage.css'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Email must be valid'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = () => {
    return undefined
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-card__header">
          <p className="login-card__eyebrow">HRM System</p>
          <h1 id="login-title">Sign in</h1>
          <p className="login-card__description">
            Access your HR management workspace.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="login-form__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              aria-invalid={errors.email ? 'true' : 'false'}
              {...register('email')}
            />
            {errors.email ? (
              <p className="login-form__error">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="login-form__field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-invalid={errors.password ? 'true' : 'false'}
              {...register('password')}
            />
            {errors.password ? (
              <p className="login-form__error">{errors.password.message}</p>
            ) : null}
          </div>

          <Button
            className="login-form__button"
            type="submit"
            disabled={isSubmitting}
          >
            Login
          </Button>
        </form>
      </section>
    </main>
  )
}
