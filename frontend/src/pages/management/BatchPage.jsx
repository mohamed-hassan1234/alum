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

const initialForm = { batchName: '', year: '', description: '' }

export default function BatchPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState(initialForm)
  const [editing, setEditing] = useState(null)
  const [openModal, setOpenModal] = useState(false)
  const [openChartModal, setOpenChartModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const batchesQ = useQuery({
    queryKey: ['batches'],
    queryFn: alumniService.getBatches,
  })

  const dashboardQ = useQuery({
    queryKey: ['dashboard-mini-batch'],
    queryFn: () => alumniService.getDashboard({ startYear: 2020, endYear: 2025 }),
  })

  const createMut = useMutation({
    mutationFn: alumniService.createBatch,
    onSuccess: () => {
      toast.success('Batch created')
      setOpenModal(false)
      setForm(initialForm)
      qc.invalidateQueries({ queryKey: ['batches'] })
      qc.invalidateQueries({ queryKey: ['dashboard-mini-batch'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => alumniService.updateBatch(id, payload),
    onSuccess: () => {
      toast.success('Batch updated')
      setOpenModal(false)
      setEditing(null)
      setForm(initialForm)
      qc.invalidateQueries({ queryKey: ['batches'] })
      qc.invalidateQueries({ queryKey: ['dashboard-mini-batch'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMut = useMutation({
    mutationFn: alumniService.deleteBatch,
    onSuccess: () => {
      toast.success('Batch deleted')
      setDeleteTarget(null)
      qc.invalidateQueries({ queryKey: ['batches'] })
      qc.invalidateQueries({ queryKey: ['dashboard-mini-batch'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const rows = batchesQ.data?.data || []
  const miniData = dashboardQ.data?.data?.charts?.studentsPerBatch || []
  const previewData = miniData.slice(0, 10)
  const fullChartHeight = Math.max(360, miniData.length * 34)

  function openCreate() {
    setEditing(null)
    setForm(initialForm)
    setOpenModal(true)
  }

  function openEdit(item) {
    setEditing(item)
    setForm({
      batchName: item.batchName || '',
      year: String(item.year || ''),
      description: item.description || '',
    })
    setOpenModal(true)
  }

  function onSubmit(e) {
    e.preventDefault()
    if (!form.batchName.trim()) return toast.error('Batch name is required')
    if (!form.year.trim()) return toast.error('Year is required')
    const payload = {
      batchName: form.batchName.trim(),
      year: Number(form.year),
      description: form.description.trim(),
    }
    if (editing?._id) updateMut.mutate({ id: editing._id, payload })
    else createMut.mutate(payload)
  }

  const columns = useMemo(
    () => [
      { header: 'Batch', accessorKey: 'batchName' },
      { header: 'Year', accessorKey: 'year' },
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
              aria-label="Edit batch"
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
              aria-label="Delete batch"
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
        title="Batch Management"
        subtitle="Manage graduating batches and years."
        right={
          <Button onClick={openCreate}>
            <MaterialIcon name="add" />
            Add Batch
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2 p-4">
          {rows.length ? (
            <DataTable columns={columns} data={rows} className="max-h-[60vh]" />
          ) : (
            <EmptyState title="No batches yet" message="Create your first batch." />
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-semibold">Students Per Batch</h3>
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
                  <XAxis dataKey="year" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1c9d56" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No chart data" message="Add students to see batch distribution." />
          )}
        </Card>
      </div>

      <Modal
        open={openChartModal}
        onClose={() => setOpenChartModal(false)}
        title="Students Per Batch"
        description={`Showing all ${miniData.length} batch years.`}
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
                  <YAxis type="category" dataKey="year" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1c9d56" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <EmptyState title="No chart data" message="Add students to see batch distribution." />
        )}
      </Modal>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editing ? 'Edit Batch' : 'Add Batch'}
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Batch Name"
            value={form.batchName}
            onChange={(e) => setForm((p) => ({ ...p, batchName: e.target.value }))}
            placeholder="Batch 2025"
          />
          <Input
            label="Year"
            type="number"
            value={form.year}
            onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
            placeholder="2025"
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
              {editing ? 'Save Changes' : 'Create Batch'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget?._id)}
        title="Delete Batch"
        message={`Delete "${deleteTarget?.batchName}"?`}
        confirmText={<MaterialIcon name="delete" />}
        confirmAriaLabel="Delete batch"
        danger
      />
    </div>
  )
}
