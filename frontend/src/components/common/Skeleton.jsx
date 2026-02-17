import clsx from 'clsx'

export default function Skeleton({ className }) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-xl bg-[rgb(var(--muted))] dark:bg-white/10',
        className
      )}
    />
  )
}

