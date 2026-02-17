import Card from './Card'

export default function StatCard({ title, value, hint, accent = 'primary' }) {
  return (
    <Card className="p-5">
      <div className="text-sm font-medium text-[rgb(var(--text-muted))]">{title}</div>
      <div
        className={`mt-2 font-display text-3xl font-bold ${
          accent === 'secondary' ? 'text-secondary' : 'text-primary'
        }`}
      >
        {value}
      </div>
      {hint ? <div className="mt-2 text-xs text-[rgb(var(--text-muted))]">{hint}</div> : null}
    </Card>
  )
}

