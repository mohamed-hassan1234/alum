import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { MdDarkMode, MdLightMode } from 'react-icons/md'
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values) {
    const ok = await login(values)
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
              className="h-28 w-28 rounded-2xl bg-white/90 p-3 object-contain xl:h-32 xl:w-32"
            />
            <h1 className="mt-10 font-display text-4xl font-bold leading-tight">
              Alumni Management System
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/90">
              Track graduates, manage academic records, and analyze employment outcomes in one
              admin platform.
            </p>
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <img
              src="/logo.png"
              alt="Hormuud University SRC logo"
              className="h-auto w-44 max-w-full object-contain sm:w-52"
            />
            <div className="mt-3">
              <h2 className="font-display text-3xl font-bold leading-tight">Alumni Admin Login</h2>
              <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">Sign in to continue</p>
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
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-[rgb(var(--text-muted))]">
            Need a new admin account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Register here
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
