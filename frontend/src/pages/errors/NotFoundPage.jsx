import { Link } from 'react-router-dom'
import Button from '../../components/common/Button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-black/5 bg-[rgb(var(--panel))]/90 p-8 text-center shadow-soft dark:border-white/10 dark:shadow-softDark">
        <h1 className="font-display text-3xl font-bold">404</h1>
        <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">
          The page you requested does not exist.
        </p>
        <div className="mt-5">
          <Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

