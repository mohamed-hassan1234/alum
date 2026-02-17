import clsx from 'clsx'

export default function MaterialIcon({ name, className, ...props }) {
  return (
    <span className={clsx('material-symbols-outlined', className)} aria-hidden="true" {...props}>
      {name}
    </span>
  )
}
