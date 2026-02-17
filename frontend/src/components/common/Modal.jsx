import { useEffect } from 'react'
import clsx from 'clsx'

export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
  className,
  containerClassName,
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 cursor-default bg-black/40"
        aria-label="Close modal"
        onClick={() => onClose?.()}
      />
      <div className={clsx('relative mx-auto mt-[8vh] w-[min(720px,92vw)]', containerClassName)}>
        <div
          role="dialog"
          aria-modal="true"
          className={clsx(
            'rounded-3xl border border-black/5 bg-[rgb(var(--panel))]/85 shadow-soft backdrop-blur dark:border-white/10 dark:shadow-softDark',
            className
          )}
        >
          {(title || description) && (
            <div className="border-b border-black/5 px-6 py-5 dark:border-white/10">
              {title && <h2 className="font-display text-xl font-bold">{title}</h2>}
              {description && (
                <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">{description}</p>
              )}
            </div>
          )}
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </div>
  )
}
