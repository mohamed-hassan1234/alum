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
import SelectField from '../../components/common/Select'
import MaterialIcon from '../../components/common/MaterialIcon'
import { alumniService } from '../../services/alumniService'
import { getErrorMessage } from '../../utils/http'

const initialForm = { departmentName: '', facultyId: '', description: '' }

export default function DepartmentPage() {
  const qc = useQueryClient()
  const [selectedFaculty, setSelectedFaculty] = useState('')
  const [form, setForm] = useState(initialForm)
  const [editing, setEditing] = useState(null)
  const [openModal, setOpenModal] = useState(false)
  const [openChartModal, setOpenChartModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const facultiesQ = useQuery({
    queryKey: ['faculties'],
    queryFn: alumniService.getFaculties,
  })

  const departmentsQ = useQuery({
    queryKey: ['departments', selectedFaculty],
    queryFn: () =>
      alumniService.getDepartments(selectedFaculty ? { facultyId: selectedFaculty } : {}),
  })

  const dashboardQ = useQuery({
    queryKey: ['dashboard-mini-department'],
    queryFn: () => alumniService.getDashboard({ startYear: 2020, endYear: 2025 }),
  })

  const createMut = useMutation({
    mutationFn: alumniService.createDepartment,
    onSuccess: () => {
      toast.success('Department created')
      setOpenModal(false)
      setForm(initialForm)
      qc.invalidateQueries({ queryKey: ['departments'] })
      qc.invalidateQueries({ queryKey: ['dashboard-mini-department'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => alumniService.updateDepartment(id, payload),
    onSuccess: () => {
      toast.success('Department updated')
      setOpenModal(false)
      setEditing(null)
      setForm(initialForm)
      qc.invalidateQueries({ queryKey: ['departments'] })
      qc.invalidateQueries({ queryKey: ['dashboard-mini-department'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMut = useMutation({
    mutationFn: alumniService.deleteDepartment,
    onSuccess: () => {
      toast.success('Department deleted')
      setDeleteTarget(null)
      qc.invalidateQueries({ queryKey: ['departments'] })
      qc.invalidateQueries({ queryKey: ['dashboard-mini-department'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const faculties = facultiesQ.data?.data || []
  const rows = departmentsQ.data?.data || []
  const miniData = dashboardQ.data?.data?.mini?.studentsPerDepartment || []
  const previewData = miniData.slice(0, 10)
  const fullChartHeight = Math.max(360, miniData.length * 42)

  function openCreate() {
    setEditing(null)
    setForm(initialForm)
    setOpenModal(true)
  }

  function openEdit(item) {
    setEditing(item)
    setForm({
      departmentName: item.departmentName || '',
      facultyId: item.facultyId?._id || item.facultyId || '',
      description: item.description || '',
    })
    setOpenModal(true)
  }

  function onSubmit(e) {
    e.preventDefault()
    if (!form.departmentName.trim()) return toast.error('Department name is required')
    if (!form.facultyId) return toast.error('Faculty is required')
    const payload = {
      departmentName: form.departmentName.trim(),
      facultyId: form.facultyId,
      description: form.description.trim(),
    }
    if (editing?._id) updateMut.mutate({ id: editing._id, payload })
    else createMut.mutate(payload)
  }

  const columns = useMemo(
    () => [
      { header: 'Department', accessorKey: 'departmentName' },
      {
        header: 'Faculty',
        cell: ({ row }) => row.original.facultyId?.facultyName || '-',
      },
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
              aria-label="Edit department"
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
              aria-label="Delete department"
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
        title="Department Management"
        subtitle="Manage departments and filter by faculty."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="w-full rounded-xl border border-black/5 bg-[rgb(var(--panel))]/70 px-3 py-2 text-sm sm:w-auto dark:border-white/10"
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
            >
              <option value="">All Faculties</option>
              {faculties.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.facultyName}
                </option>
              ))}
            </select>
            <Button onClick={openCreate} className="w-full sm:w-auto">
              <MaterialIcon name="add" />
              Add Department
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2 p-4">
          {rows.length ? (
            <DataTable columns={columns} data={rows} className="max-h-[60vh]" />
          ) : (
            <EmptyState title="No departments yet" message="Create your first department." />
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-semibold">Students Per Department</h3>
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
                  <XAxis dataKey="departmentName" angle={-22} textAnchor="end" interval={0} height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#31a5d6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No chart data" message="Add students to see department distribution." />
          )}
        </Card>
      </div>

      <Modal
        open={openChartModal}
        onClose={() => setOpenChartModal(false)}
        title="Students Per Department"
        description={`Showing all ${miniData.length} departments.`}
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
                  <YAxis type="category" dataKey="departmentName" width={210} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#31a5d6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <EmptyState title="No chart data" message="Add students to see department distribution." />
        )}
      </Modal>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editing ? 'Edit Department' : 'Add Department'}
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Department Name"
            value={form.departmentName}
            onChange={(e) => setForm((p) => ({ ...p, departmentName: e.target.value }))}
            placeholder="Computer Science"
          />
          <SelectField
            label="Faculty"
            value={form.facultyId}
            onChange={(e) => setForm((p) => ({ ...p, facultyId: e.target.value }))}
          >
            <option value="">Select faculty</option>
            {faculties.map((f) => (
              <option key={f._id} value={f._id}>
                {f.facultyName}
              </option>
            ))}
          </SelectField>
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
              {editing ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget?._id)}
        title="Delete Department"
        message={`Delete "${deleteTarget?.departmentName}"?`}
        confirmText={<MaterialIcon name="delete" />}
        confirmAriaLabel="Delete department"
        danger
      />
    </div>
  )
}
