import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate, useLocation } from 'react-router-dom'
import { MdDarkMode, MdLightMode } from 'react-icons/md'
import { useState } from 'react'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required').min(6, 'Minimum 6 characters'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: 'admin@alumni.local', password: 'Admin@123' },
  })

  async function onSubmit(values) {
    setSubmitting(true)
    const ok = await login(values)
    setSubmitting(false)
    if (!ok) return

    const to = location.state?.from || '/dashboard'
    navigate(to, { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-4 top-4 rounded-xl border border-black/5 bg-[rgb(var(--panel))]/70 p-2 text-[rgb(var(--text-muted))] backdrop-blur hover:text-[rgb(var(--text))] dark:border-white/10"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <MdLightMode /> : <MdDarkMode />}
      </button>

      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        <Card className="hidden overflow-hidden lg:block">
          <div className="h-full bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/75 p-10 text-white">
            <img
              src="/logo.png"
              alt="Hormuud University SRC logo"
              className="h-16 w-16 rounded-xl bg-white/90 p-1.5 object-contain"
            />
            <h1 className="mt-10 font-display text-4xl font-bold leading-tight">
              Alumni Management System
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/90">
              Track graduates, manage academic records, and analyze employment outcomes in one
              admin platform.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/20 p-3">
                <div className="text-xs uppercase tracking-wide text-white/80">Modules</div>
                <div className="mt-1 text-lg font-semibold">12+</div>
              </div>
              <div className="rounded-xl bg-white/20 p-3">
                <div className="text-xs uppercase tracking-wide text-white/80">Security</div>
                <div className="mt-1 text-lg font-semibold">JWT Auth</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <img
              src="/logo.png"
              alt="Hormuud University SRC logo"
              className="h-12 w-12 rounded-xl bg-white p-1 object-contain"
            />
            <div>
              <h2 className="font-display text-xl font-bold">Alumni Admin Login</h2>
              <p className="text-xs text-[rgb(var(--text-muted))]">Sign in to continue</p>
            </div>
          </div>

          <h2 className="hidden font-display text-2xl font-bold lg:block">Admin Login</h2>
          <p className="mb-6 mt-1 text-sm text-[rgb(var(--text-muted))]">
            Use your admin credentials to access the dashboard.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="Enter admin email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
