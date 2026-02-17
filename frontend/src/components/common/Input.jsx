import clsx from 'clsx'
import { useState } from 'react'
import MaterialIcon from './MaterialIcon'

function autoPlaceholder(label, type) {
  if (!label) return ''
  const normalized = String(label).toLowerCase().trim()
  if (!normalized) return ''

  if (type === 'email') return `Enter ${normalized} (e.g. name@example.com)`
  if (type === 'password') return `Enter ${normalized}`
  return `Enter ${normalized}`
}

export default function Input({
  label,
  hint,
  error,
  className,
  inputClassName,
  type = 'text',
  placeholder,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword && showPassword ? 'text' : type
  const resolvedPlaceholder = placeholder === undefined ? autoPlaceholder(label, type) : placeholder

  return (
    <label className={clsx('block', className)}>
      {label ? (
        <span className="mb-1.5 block text-sm font-semibold text-[rgb(var(--text))]">
          {label}
        </span>
      ) : null}
      <div className="relative">
        <input
          type={resolvedType}
          placeholder={resolvedPlaceholder}
          className={clsx(
            'h-11 w-full rounded-2xl border border-black/10 bg-[rgb(var(--panel))]/95 px-3 py-2.5 text-sm text-[rgb(var(--text))] outline-none',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-all duration-200 dark:border-white/15 dark:bg-[rgb(var(--panel))]/90',
            'placeholder:text-[rgb(var(--text-muted))]/80 focus:border-secondary/60 focus:ring-4 focus:ring-secondary/15',
            isPassword ? 'pr-11' : null,
            error ? 'border-red-400/60 ring-4 ring-red-400/20 focus:border-red-400/60 focus:ring-red-400/20' : null,
            inputClassName
          )}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[rgb(var(--text-muted))] transition hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--text))]"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            <MaterialIcon name={showPassword ? 'visibility_off' : 'visibility'} className="text-[18px]" />
          </button>
        ) : null}
      </div>
      {error ? (
        <span className="mt-1 block text-sm text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-sm text-[rgb(var(--text-muted))]">{hint}</span>
      ) : null}
    </label>
  )
}
