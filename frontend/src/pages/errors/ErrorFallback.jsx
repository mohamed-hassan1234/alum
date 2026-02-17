import Button from '../../components/common/Button'

export default function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-red-300/40 bg-white/90 p-8 shadow-soft dark:bg-slate-900/90">
        <h1 className="font-display text-2xl font-bold text-red-600">Application Error</h1>
        <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
          Something unexpected happened. You can retry without losing your data.
        </p>
        <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
          {error?.message || 'Unknown error'}
        </pre>
        <div className="mt-5">
          <Button onClick={resetErrorBoundary}>Retry</Button>
        </div>
      </div>
    </div>
  )
}

