export default function PageHeader({ title, subtitle, right }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-bold text-[rgb(var(--text))] sm:text-2xl">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">{subtitle}</p>
        ) : null}
      </div>
      {right ? (
        <div className="w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">{right}</div>
        </div>
      ) : null}
    </div>
  )
}

