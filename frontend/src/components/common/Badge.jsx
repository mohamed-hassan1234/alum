import clsx from 'clsx'

const variants = {
  green: 'bg-primary/10 text-primary border-primary/20',
  blue: 'bg-secondary/10 text-secondary border-secondary/20',
  slate: 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-300',
  red: 'bg-red-500/10 text-red-600 border-red-500/20',
}

export default function Badge({ variant = 'slate', className, children }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        variants[variant] || variants.slate,
        className
      )}
    >
      {children}
    </span>
  )
}

