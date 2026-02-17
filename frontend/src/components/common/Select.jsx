import clsx from 'clsx'

export default function Select({
  label,
  hint,
  error,
  className,
  selectClassName,
  children,
  ...props
}) {
  return (
    <label className={clsx('block', className)}>
      {label ? (
        <span className="mb-1.5 block text-sm font-semibold text-[rgb(var(--text))]">
          {label}
        </span>
      ) : null}
      <select
        className={clsx(
          'h-11 w-full rounded-2xl border border-black/10 bg-[rgb(var(--panel))]/95 px-3 py-2.5 text-sm text-[rgb(var(--text))] outline-none',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-all duration-200 dark:border-white/15 dark:bg-[rgb(var(--panel))]/90',
          'focus:border-secondary/60 focus:ring-4 focus:ring-secondary/15',
          error ? 'border-red-400/60 ring-4 ring-red-400/20 focus:border-red-400/60 focus:ring-red-400/20' : null,
          selectClassName
        )}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <span className="mt-1 block text-sm text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-sm text-[rgb(var(--text-muted))]">{hint}</span>
      ) : null}
    </label>
  )
}
