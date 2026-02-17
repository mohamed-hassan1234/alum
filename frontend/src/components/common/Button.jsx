import clsx from 'clsx'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary/40 disabled:cursor-not-allowed disabled:opacity-60'

const variants = {
  primary:
    'bg-primary text-white shadow-[0_10px_20px_rgba(28,157,86,0.18)] hover:-translate-y-px hover:bg-primary/90',
  secondary:
    'bg-secondary text-white shadow-[0_10px_20px_rgba(49,165,214,0.16)] hover:-translate-y-px hover:bg-secondary/90',
  ghost:
    'border border-black/5 bg-transparent text-[rgb(var(--text))] hover:bg-[rgb(var(--muted))] dark:border-white/10',
  danger:
    'bg-red-600 text-white shadow-[0_10px_20px_rgba(220,38,38,0.18)] hover:-translate-y-px hover:bg-red-700',
}

const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}) {
  return (
    <button
      className={clsx(base, variants[variant] || variants.primary, sizes[size], className)}
      {...props}
    />
  )
}
