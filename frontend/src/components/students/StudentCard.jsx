import { Link } from 'react-router-dom'
import Badge from '../common/Badge'
import MaterialIcon from '../common/MaterialIcon'

export default function StudentCard({ student, onEdit, onDelete }) {
  const employed = Boolean(student.jobId)
  const image = student.photoImage || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(student.name || 'Student')}`

  return (
    <div className="rounded-2xl border border-black/5 bg-[rgb(var(--panel))]/70 p-4 shadow-soft dark:border-white/10 dark:shadow-softDark">
      <div className="flex items-start gap-3">
        <img src={image} alt={student.name} className="h-14 w-14 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <Link to={`/students/${student._id}`} className="font-display text-base font-bold hover:text-primary">
            {student.name}
          </Link>
          <p className="text-xs font-semibold text-[rgb(var(--text-muted))]">
            Student ID: {student.studentId || '-'}
          </p>
          <p className="truncate text-xs text-[rgb(var(--text-muted))]">{student.email || 'No email'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={employed ? 'green' : 'slate'}>
              {student.jobId?.jobName || 'Unemployed'}
            </Badge>
            <Badge variant="blue">{student.batchId?.batchName || 'No batch'}</Badge>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-between gap-2">
        <button
          type="button"
          onClick={() => onEdit(student)}
          className="rounded-lg px-2 py-1.5 text-xs font-semibold text-[rgb(var(--text-muted))] hover:text-secondary"
          title="Edit"
          aria-label="Edit student"
        >
          <MaterialIcon name="edit" className="text-[16px]" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(student)}
          className="rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
          title="Delete"
          aria-label="Delete student"
        >
          <MaterialIcon name="delete" className="text-[16px]" />
        </button>
      </div>
    </div>
  )
}
