import Card from '../common/Card'

export default function ChartCard({ title, subtitle, right, children, className }) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-4 border-b border-black/5 px-5 py-4 dark:border-white/10">
        <div>
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </Card>
  )
}

