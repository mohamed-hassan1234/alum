import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import DataTable from '../../components/common/DataTable'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Textarea from '../../components/common/Textarea'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import EmptyState from '../../components/common/EmptyState'
import MaterialIcon from '../../components/common/MaterialIcon'
import { alumniService } from '../../services/alumniService'
import { getErrorMessage } from '../../utils/http'

const initialForm = { jobName: '', description: '' }

export default function JobPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState(initialForm)
  const [editing, setEditing] = useState(null)
  const [openModal, setOpenModal] = useState(false)
  const [openChartModal, setOpenChartModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const jobsQ = useQuery({
    queryKey: ['jobs'],
    queryFn: alumniService.getJobs,
  })

  const dashboardQ = useQuery({
    queryKey: ['dashboard-mini-jobs'],
    queryFn: () => alumniService.getDashboard({ startYear: 2020, endYear: 2025 }),
  })

  const createMut = useMutation({
    mutationFn: alumniService.createJob,
    onSuccess: () => {
      toast.success('Job created')
      setOpenModal(false)
      setForm(initialForm)
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['dashboard-mini-jobs'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => alumniService.updateJob(id, payload),
    onSuccess: () => {
      toast.success('Job updated')
      setOpenModal(false)
      setEditing(null)
      setForm(initialForm)
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['dashboard-mini-jobs'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMut = useMutation({
    mutationFn: alumniService.deleteJob,
    onSuccess: () => {
      toast.success('Job deleted')
      setDeleteTarget(null)
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['dashboard-mini-jobs'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const rows = jobsQ.data?.data || []
  const miniData = dashboardQ.data?.data?.mini?.topJobs || []
  const previewData = miniData.slice(0, 10)
  const fullChartHeight = Math.max(360, miniData.length * 42)

  function openCreate() {
    setEditing(null)
    setForm(initialForm)
    setOpenModal(true)
  }

  function openEdit(item) {
    setEditing(item)
    setForm({ jobName: item.jobName || '', description: item.description || '' })
    setOpenModal(true)
  }

  function onSubmit(e) {
    e.preventDefault()
    if (!form.jobName.trim()) return toast.error('Job name is required')
    const payload = {
      jobName: form.jobName.trim(),
      description: form.description.trim(),
    }
    if (editing?._id) updateMut.mutate({ id: editing._id, payload })
    else createMut.mutate(payload)
  }

  const columns = useMemo(
    () => [
      { header: 'Job', accessorKey: 'jobName' },
      {
        header: 'Description',
        cell: ({ row }) => row.original.description || '-',
      },
      {
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="!border-0 !bg-transparent !shadow-none hover:!bg-transparent hover:text-secondary"
              onClick={(e) => {
                e.stopPropagation()
                openEdit(row.original)
              }}
              title="Edit"
              aria-label="Edit job"
            >
              <MaterialIcon name="edit" className="text-[16px]" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="!border-0 !bg-transparent !shadow-none text-red-600 hover:!bg-transparent hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteTarget(row.original)
              }}
              title="Delete"
              aria-label="Delete job"
            >
              <MaterialIcon name="delete" className="text-[16px]" />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Management"
        subtitle="Maintain job positions assigned to alumni."
        right={
          <Button onClick={openCreate}>
            <MaterialIcon name="add" />
            Add Job
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2 p-4">
          {rows.length ? (
            <DataTable columns={columns} data={rows} className="max-h-[60vh]" />
          ) : (
            <EmptyState title="No jobs yet" message="Create your first job role." />
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-semibold">Most Common Jobs</h3>
              <p className="text-xs text-[rgb(var(--text-muted))]">Top 10 summary</p>
            </div>
            {miniData.length ? (
              <Button size="sm" variant="ghost" onClick={() => setOpenChartModal(true)}>
                View Full
              </Button>
            ) : null}
          </div>
          {previewData.length ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={previewData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="jobName" angle={-22} textAnchor="end" interval={0} height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#31a5d6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No chart data" message="Add students to see top jobs." />
          )}
        </Card>
      </div>

      <Modal
        open={openChartModal}
        onClose={() => setOpenChartModal(false)}
        title="Most Common Jobs"
        description={`Showing all ${miniData.length} job roles.`}
        containerClassName="w-[min(1180px,96vw)]"
        className="max-h-[85vh] overflow-hidden"
      >
        {miniData.length ? (
          <div className="h-[72vh] overflow-y-auto pr-1">
            <div className="min-h-[360px]" style={{ height: `${fullChartHeight}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={miniData} layout="vertical" margin={{ left: 12, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="jobName" width={220} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#31a5d6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <EmptyState title="No chart data" message="Add students to see top jobs." />
        )}
      </Modal>

      <Modal open={openModal} onClose={() => setOpenModal(false)} title={editing ? 'Edit Job' : 'Add Job'}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Job Name"
            value={form.jobName}
            onChange={(e) => setForm((p) => ({ ...p, jobName: e.target.value }))}
            placeholder="Software Engineer"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
              <MaterialIcon name={editing ? 'save' : 'add'} />
              {editing ? 'Save Changes' : 'Create Job'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget?._id)}
        title="Delete Job"
        message={`Delete "${deleteTarget?.jobName}"?`}
        confirmText={<MaterialIcon name="delete" />}
        confirmAriaLabel="Delete job"
        danger
      />
    </div>
  )
}
