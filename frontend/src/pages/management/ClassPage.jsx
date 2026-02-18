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

const initialForm = { className: '', departmentId: '', description: '' }

export default function ClassPage() {
  const qc = useQueryClient()
  const [selectedFaculty, setSelectedFaculty] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
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

  const classesQ = useQuery({
    queryKey: ['classes', selectedFaculty, selectedDepartment],
    queryFn: () =>
      alumniService.getClasses({
        ...(selectedFaculty ? { facultyId: selectedFaculty } : {}),
        ...(selectedDepartment ? { departmentId: selectedDepartment } : {}),
      }),
  })

  const dashboardQ = useQuery({
    queryKey: ['dashboard-mini-class'],
    queryFn: () => alumniService.getDashboard({ startYear: 2020, endYear: 2025 }),
  })

  const createMut = useMutation({
    mutationFn: alumniService.createClass,
    onSuccess: () => {
      toast.success('Class created')
      setOpenModal(false)
      setForm(initialForm)
      qc.invalidateQueries({ queryKey: ['classes'] })
      qc.invalidateQueries({ queryKey: ['dashboard-mini-class'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => alumniService.updateClass(id, payload),
    onSuccess: () => {
      toast.success('Class updated')
      setOpenModal(false)
      setEditing(null)
      setForm(initialForm)
      qc.invalidateQueries({ queryKey: ['classes'] })
      qc.invalidateQueries({ queryKey: ['dashboard-mini-class'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMut = useMutation({
    mutationFn: alumniService.deleteClass,
    onSuccess: () => {
      toast.success('Class deleted')
      setDeleteTarget(null)
      qc.invalidateQueries({ queryKey: ['classes'] })
      qc.invalidateQueries({ queryKey: ['dashboard-mini-class'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const faculties = facultiesQ.data?.data || []
  const departments = departmentsQ.data?.data || []
  const rawRows = classesQ.data?.data
  const rows = useMemo(() => {
    const list = Array.isArray(rawRows) ? rawRows : []
    return list.filter((item) => {
      const rowDepartmentId = String(item?.departmentId?._id || item?.departmentId || '')
      const rowFacultyId = String(
        item?.departmentId?.facultyId?._id || item?.departmentId?.facultyId || ''
      )

      if (selectedDepartment && rowDepartmentId !== String(selectedDepartment)) return false
      if (selectedFaculty && rowFacultyId !== String(selectedFaculty)) return false
      return true
    })
  }, [rawRows, selectedDepartment, selectedFaculty])
  const miniData = dashboardQ.data?.data?.mini?.classSizes || []
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
      className: item.className || '',
      departmentId: item.departmentId?._id || item.departmentId || '',
      description: item.description || '',
    })
    setOpenModal(true)
  }

  function onSubmit(e) {
    e.preventDefault()
    if (!form.className.trim()) return toast.error('Class name is required')
    if (!form.departmentId) return toast.error('Department is required')
    const payload = {
      className: form.className.trim(),
      departmentId: form.departmentId,
      description: form.description.trim(),
    }
    if (editing?._id) updateMut.mutate({ id: editing._id, payload })
    else createMut.mutate(payload)
  }

  const columns = useMemo(
    () => [
      { header: 'Class', accessorKey: 'className' },
      {
        header: 'Department',
        cell: ({ row }) => row.original.departmentId?.departmentName || '-',
      },
      {
        header: 'Faculty',
        cell: ({ row }) => row.original.departmentId?.facultyId?.facultyName || '-',
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
              aria-label="Edit class"
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
              aria-label="Delete class"
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
        title="Class Management"
        subtitle="Manage class records with faculty and department filters."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="w-full rounded-xl border border-black/5 bg-[rgb(var(--panel))]/70 px-3 py-2 text-sm sm:w-auto dark:border-white/10"
              value={selectedFaculty}
              onChange={(e) => {
                setSelectedFaculty(e.target.value)
                setSelectedDepartment('')
              }}
            >
              <option value="">All Faculties</option>
              {faculties.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.facultyName}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-xl border border-black/5 bg-[rgb(var(--panel))]/70 px-3 py-2 text-sm sm:w-auto dark:border-white/10"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.departmentName}
                </option>
              ))}
            </select>
            <Button onClick={openCreate} className="w-full sm:w-auto">
              <MaterialIcon name="add" />
              Add Class
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2 p-4">
          {rows.length ? (
            <DataTable columns={columns} data={rows} className="max-h-[60vh]" />
          ) : (
            <EmptyState title="No classes yet" message="Create your first class." />
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-semibold">Class Sizes</h3>
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
                  <XAxis dataKey="className" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1c9d56" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No chart data" message="Add students to see class sizes." />
          )}
        </Card>
      </div>

      <Modal
        open={openChartModal}
        onClose={() => setOpenChartModal(false)}
        title="Class Sizes"
        description={`Showing all ${miniData.length} classes.`}
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
                  <YAxis type="category" dataKey="className" width={180} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1c9d56" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <EmptyState title="No chart data" message="Add students to see class sizes." />
        )}
      </Modal>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editing ? 'Edit Class' : 'Add Class'}
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Class Name"
            value={form.className}
            onChange={(e) => setForm((p) => ({ ...p, className: e.target.value }))}
            placeholder="CS-1"
          />
          <SelectField
            label="Department"
            value={form.departmentId}
            onChange={(e) => setForm((p) => ({ ...p, departmentId: e.target.value }))}
          >
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.departmentName}
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
              {editing ? 'Save Changes' : 'Create Class'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMut.mutate(deleteTarget?._id)}
        title="Delete Class"
        message={`Delete "${deleteTarget?.className}"?`}
        confirmText={<MaterialIcon name="delete" />}
        confirmAriaLabel="Delete class"
        danger
      />
    </div>
  )
}
