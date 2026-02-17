import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Link, useNavigate } from 'react-router-dom'
import { MdDarkMode, MdLightMode } from 'react-icons/md'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const schema = yup.object({
  name: yup.string().required('Name is required').max(120, 'Name is too long'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required').min(6, 'Minimum 6 characters'),
  confirmPassword: yup
    .string()
    .required('Confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
})

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  async function onSubmit(values) {
    setSubmitting(true)
    const ok = await registerAdmin({
      name: values.name,
      email: values.email,
      password: values.password,
    })
    setSubmitting(false)
    if (!ok) return
    navigate('/dashboard', { replace: true })
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
              className="h-20 w-20 rounded-xl bg-white/90 p-2 object-contain"
            />
            <h1 className="mt-10 font-display text-4xl font-bold leading-tight">
              Alumni Management System
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/90">
              Create an admin account, then manage students, analytics, reports, and system
              settings.
            </p>
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <img
              src="/logo.png"
              alt="Hormuud University SRC logo"
              className="h-16 w-16 rounded-xl bg-white p-1.5 object-contain"
            />
            <div>
              <h2 className="font-display text-xl font-bold">Alumni Admin Registration</h2>
              <p className="text-xs text-[rgb(var(--text-muted))]">Create account to continue</p>
            </div>
          </div>

          <h2 className="hidden font-display text-2xl font-bold lg:block">Admin Registration</h2>
          <p className="mb-6 mt-1 text-sm text-[rgb(var(--text-muted))]">
            Create a new admin account using your own data.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Name"
              type="text"
              placeholder="Enter admin name"
              error={errors.name?.message}
              {...register('name')}
            />
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
              placeholder="Create password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create Admin Account'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-[rgb(var(--text-muted))]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Go to login
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
