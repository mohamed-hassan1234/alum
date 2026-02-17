import clsx from 'clsx'

export default function Spinner({ className }) {
  return (
    <span
      className={clsx(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-secondary/30 border-t-secondary',
        className
      )}
      aria-label="Loading"
      role="status"
    />
  )
}

