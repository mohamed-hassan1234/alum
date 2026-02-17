import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import { alumniService } from '../../services/alumniService'
import { formatDate } from '../../utils/format'

export default function StudentDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const studentQ = useQuery({
    queryKey: ['student', id],
    queryFn: () => alumniService.getStudent(id),
    enabled: Boolean(id),
  })

  const student = studentQ.data?.data
  const related = studentQ.data?.related || []

  if (!studentQ.isLoading && !student) {
    return <EmptyState title="Student not found" message="The student profile could not be loaded." />
  }

  const image =
    student?.photoImage ||
    `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(student?.name || 'Student')}`

  return (
    <div className="space-y-6 print:bg-white">
      <PageHeader
        title="Student Details"
        subtitle="Profile and academic/employment snapshot."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => navigate(-1)} className="w-full sm:w-auto">
              Back
            </Button>
            <Button variant="secondary" onClick={() => window.print()} className="w-full sm:w-auto">
              Print Profile
            </Button>
          </div>
        }
      />

      <Card className="p-5">
        <div className="flex flex-col gap-5 md:flex-row">
          <img src={image} alt={student?.name} className="h-40 w-40 rounded-2xl object-cover" />
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold">{student?.name}</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="blue">{student?.gender}</Badge>
              <Badge variant={student?.jobId ? 'green' : 'slate'}>
                {student?.jobId?.jobName || 'Unemployed'}
              </Badge>
            </div>
            <p className="text-sm text-[rgb(var(--text-muted))]">Student ID: {student?.studentId || '-'}</p>
            <p className="text-sm text-[rgb(var(--text-muted))]">Email: {student?.email || '-'}</p>
            <p className="text-sm text-[rgb(var(--text-muted))]">Phone: {student?.phoneNumber || '-'}</p>
            <p className="text-sm text-[rgb(var(--text-muted))]">
              Created: {formatDate(student?.createdAt)} | Updated: {formatDate(student?.updatedAt)}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-display text-lg font-semibold">Academic Information</h3>
          <div className="mt-3 space-y-2 text-sm">
            <p>Faculty: {student?.classId?.departmentId?.facultyId?.facultyName || '-'}</p>
            <p>Department: {student?.classId?.departmentId?.departmentName || '-'}</p>
            <p>Class: {student?.classId?.className || '-'}</p>
            <p>
              Batch: {student?.batchId?.batchName || '-'} ({student?.batchId?.year || '-'})
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-lg font-semibold">Employment Status</h3>
          <div className="mt-3 space-y-2 text-sm">
            <p>Status: {student?.jobId ? 'Employed' : 'Unemployed'}</p>
            <p>Job: {student?.jobId?.jobName || '-'}</p>
            <p>Job Details: {student?.jobId?.description || '-'}</p>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-display text-lg font-semibold">Timeline / Notes</h3>
        <p className="mt-3 whitespace-pre-wrap text-sm text-[rgb(var(--text-muted))]">
          {student?.description || 'No notes available.'}
        </p>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg font-semibold">Related Students</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {related.length ? (
            related.map((item) => (
              <Link
                key={item._id}
                to={`/students/${item._id}`}
                className="rounded-xl border border-black/5 p-3 hover:border-secondary/40 hover:bg-secondary/5 dark:border-white/10"
              >
                <div className="font-semibold">{item.name}</div>
                <div className="text-xs text-[rgb(var(--text-muted))]">
                  {item.classId?.className || '-'} | {item.batchId?.batchName || '-'}
                </div>
              </Link>
            ))
          ) : (
            <EmptyState title="No related students" message="No matching batch/class profiles found." />
          )}
        </div>
      </Card>
    </div>
  )
}
