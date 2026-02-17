export default function EmptyState({ title = 'No data', message = 'Nothing to show yet.', right }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-[rgb(var(--panel))]/40 p-8 text-center dark:border-white/15">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">{message}</p>
      {right ? <div className="mt-5 flex justify-center">{right}</div> : null}
    </div>
  )
}

