import clsx from 'clsx'

export default function Card({ className, children }) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-black/5 bg-[rgb(var(--panel))]/70 shadow-soft backdrop-blur dark:border-white/10 dark:shadow-softDark',
        className
      )}
    >
      {children}
    </div>
  )
}

