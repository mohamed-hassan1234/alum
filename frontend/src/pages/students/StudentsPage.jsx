import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import DataTable from '../../components/common/DataTable'
import Pagination from '../../components/common/Pagination'
import EmptyState from '../../components/common/EmptyState'
import Badge from '../../components/common/Badge'
import StudentFiltersPanel from '../../components/filters/StudentFiltersPanel'
import StudentFormModal from '../../components/students/StudentFormModal'
import StudentCard from '../../components/students/StudentCard'
import Modal from '../../components/common/Modal'
import SelectField from '../../components/common/Select'
import MaterialIcon from '../../components/common/MaterialIcon'
import { alumniService } from '../../services/alumniService'
import { useDebounce } from '../../hooks/useDebounce'
import { getErrorMessage } from '../../utils/http'
import { readFilenameFromHeaders, saveBlob } from '../../utils/download'

const emptyOptions = {
  faculties: [],
  departments: [],
  classes: [],
  batches: [],
  jobs: [],
}

const defaultFilters = {
  facultyIds: [],
  departmentIds: [],
  classIds: [],
  batchYears: [],
  jobIds: [],
  genders: [],
  employmentStatus: 'all',
  search: '',
}

const initialImportForm = {
  facultyId: '',
  departmentId: '',
  classId: '',
  batchId: '',
  file: null,
}

export default function StudentsPage() {
  const qc = useQueryClient()
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [view, setView] = useState('table')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importForm, setImportForm] = useState(initialImportForm)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [deleteFilteredOpen, setDeleteFilteredOpen] = useState(false)
  const debouncedSearch = useDebounce(filters.search, 400)

  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  function clearFilters() {
    setFilters(defaultFilters)
    setPage(1)
  }

  const filtersQ = useQuery({
    queryKey: ['student-filters'],
    queryFn: alumniService.getStudentFilters,
  })

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      ...filters,
      search: debouncedSearch,
    }),
    [page, limit, filters, debouncedSearch]
  )

  const studentsQ = useQuery({
    queryKey: ['students', queryParams],
    queryFn: () => alumniService.getStudents(queryParams),
    keepPreviousData: true,
  })

  const createMut = useMutation({
    mutationFn: alumniService.createStudent,
    onSuccess: () => {
      toast.success('Student created')
      setFormOpen(false)
      setEditing(null)
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => alumniService.updateStudent(id, payload),
    onSuccess: () => {
      toast.success('Student updated')
      setFormOpen(false)
      setEditing(null)
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['student'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMut = useMutation({
    mutationFn: ({ id, force }) => alumniService.deleteStudent(id, force),
    onSuccess: (_, variables) => {
      toast.success(variables.force ? 'Student deleted permanently' : 'Student deleted')
      setDeleteTarget(null)
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteAllMut = useMutation({
    mutationFn: ({ force }) => alumniService.deleteAllStudents(force),
    onSuccess: (payload, variables) => {
      const affected = Number(payload?.affected || 0)
      toast.success(
        variables.force
          ? `Deleted ${affected} students permanently`
          : `Soft deleted ${affected} active students`
      )
      setDeleteAllOpen(false)
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteFilteredMut = useMutation({
    mutationFn: ({ force }) =>
      alumniService.deleteStudentsByFilter({
        facultyIds: filters.facultyIds,
        departmentIds: filters.departmentIds,
        classIds: filters.classIds,
        force,
      }),
    onSuccess: (payload, variables) => {
      const affected = Number(payload?.affected || 0)
      toast.success(
        variables.force
          ? `Deleted ${affected} filtered students permanently`
          : `Soft deleted ${affected} filtered students`
      )
      setDeleteFilteredOpen(false)
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const importMut = useMutation({
    mutationFn: alumniService.importStudentsBulk,
    onSuccess: (payload) => {
      const imported = payload?.summary?.imported || 0
      const skipped = payload?.summary?.skipped || 0
      toast.success(`Imported ${imported} students${skipped ? ` (${skipped} skipped)` : ''}`)
      setImportOpen(false)
      setImportForm(initialImportForm)
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const rows = studentsQ.data?.data || []
  const pagination = studentsQ.data?.pagination || { page: 1, pages: 1, total: 0, limit }
  const optionsData = filtersQ.data?.data || emptyOptions
  const importDepartments = useMemo(() => {
    if (!importForm.facultyId) return []
    return (optionsData.departments || []).filter(
      (d) => String(d.facultyId) === String(importForm.facultyId)
    )
  }, [optionsData.departments, importForm.facultyId])

  const importClasses = useMemo(() => {
    if (!importForm.departmentId) return []
    return (optionsData.classes || []).filter(
      (c) => String(c.departmentId) === String(importForm.departmentId)
    )
  }, [optionsData.classes, importForm.departmentId])

  const nameLookup = useMemo(() => {
    const byId = (list, key) => new Map((list || []).map((item) => [String(item._id), item[key]]))
    return {
      faculty: byId(optionsData.faculties, 'facultyName'),
      department: byId(optionsData.departments, 'departmentName'),
      class: byId(optionsData.classes, 'className'),
      job: byId(optionsData.jobs, 'jobName'),
    }
  }, [optionsData])

  const columns = useMemo(
    () => [
      {
        header: 'Student ID',
        cell: ({ row }) => row.original.studentId || '-',
      },
      {
        header: 'Student',
        cell: ({ row }) => {
          const s = row.original
          const image =
            s.photoImage ||
            `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(s.name || 'Student')}`
          return (
            <div className="flex items-center gap-2">
              <img src={image} alt={s.name} className="h-10 w-10 rounded-lg object-cover" />
              <div className="min-w-0">
                <Link to={`/students/${s._id}`} className="font-semibold hover:text-primary">
                  {s.name}
                </Link>
                <div className="truncate text-xs text-[rgb(var(--text-muted))]">{s.email || '-'}</div>
              </div>
            </div>
          )
        },
      },
      {
        header: 'Academic',
        cell: ({ row }) => (
          <div className="text-xs">
            <div>{row.original.classId?.className || '-'}</div>
            <div className="text-[rgb(var(--text-muted))]">{row.original.batchId?.batchName || '-'}</div>
          </div>
        ),
      },
      {
        header: 'Employment',
        cell: ({ row }) =>
          row.original.jobId ? (
            <Badge variant="green">{row.original.jobId.jobName}</Badge>
          ) : (
            <Badge variant="slate">Unemployed</Badge>
          ),
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
                setEditing(row.original)
                setFormOpen(true)
              }}
              title="Edit"
              aria-label="Edit student"
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
              aria-label="Delete student"
            >
              <MaterialIcon name="delete" className="text-[16px]" />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  async function exportData(format) {
    try {
      const res = await alumniService.exportStudents(format, queryParams)
      const ext = format === 'excel' ? 'xlsx' : format
      const fallback = `students-export.${ext}`
      const filename = readFilenameFromHeaders(res.headers, fallback)
      saveBlob(res.data, filename)
      toast.success(`${format.toUpperCase()} export downloaded`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  async function downloadImportTemplate() {
    try {
      const res = await alumniService.downloadStudentImportTemplate()
      const filename = readFilenameFromHeaders(res.headers, 'students-import-template.xlsx')
      saveBlob(res.data, filename)
      toast.success('Import template downloaded')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  function updateImport(key, value) {
    setImportForm((prev) => ({ ...prev, [key]: value }))
  }

  function openImportModal() {
    setImportForm(initialImportForm)
    setImportOpen(true)
  }

  function submitImport(e) {
    e.preventDefault()
    if (!importForm.facultyId) return toast.error('Faculty is required')
    if (!importForm.departmentId) return toast.error('Department is required')
    if (!importForm.classId) return toast.error('Class is required')
    if (!importForm.batchId) return toast.error('Batch is required')
    if (!importForm.file) return toast.error('Excel file is required')

    importMut.mutate({
      file: importForm.file,
      facultyId: importForm.facultyId,
      departmentId: importForm.departmentId,
      classId: importForm.classId,
      batchId: importForm.batchId,
    })
  }

  const activeTags = [
    ...filters.facultyIds.map((v) => ({
      key: `fac-${v}`,
      label: `Faculty: ${nameLookup.faculty.get(v) || v}`,
      clear: () => setFilter('facultyIds', filters.facultyIds.filter((x) => x !== v)),
    })),
    ...filters.departmentIds.map((v) => ({
      key: `dep-${v}`,
      label: `Dept: ${nameLookup.department.get(v) || v}`,
      clear: () => setFilter('departmentIds', filters.departmentIds.filter((x) => x !== v)),
    })),
    ...filters.classIds.map((v) => ({
      key: `class-${v}`,
      label: `Class: ${nameLookup.class.get(v) || v}`,
      clear: () => setFilter('classIds', filters.classIds.filter((x) => x !== v)),
    })),
    ...filters.batchYears.map((v) => ({ key: `batch-${v}`, label: `Batch Year: ${v}`, clear: () => setFilter('batchYears', filters.batchYears.filter((x) => x !== v)) })),
    ...filters.jobIds.map((v) => ({
      key: `job-${v}`,
      label: `Job: ${nameLookup.job.get(v) || v}`,
      clear: () => setFilter('jobIds', filters.jobIds.filter((x) => x !== v)),
    })),
    ...filters.genders.map((v) => ({ key: `gender-${v}`, label: `Gender: ${v}`, clear: () => setFilter('genders', filters.genders.filter((x) => x !== v)) })),
    ...(filters.employmentStatus !== 'all'
      ? [{ key: 'employment', label: `Status: ${filters.employmentStatus}`, clear: () => setFilter('employmentStatus', 'all') }]
      : []),
    ...(filters.search.trim()
      ? [{
          key: 'search',
          label: `Search (Name/Email/ID): ${filters.search}`,
          clear: () => setFilter('search', ''),
        }]
      : []),
  ]
  const hasClassFilterForDelete =
    filters.classIds.length > 0 || filters.departmentIds.length > 0 || filters.facultyIds.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Management"
        subtitle="Advanced filtering, CRUD actions, pagination, and export."
        right={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setView((v) => (v === 'table' ? 'grid' : 'table'))}>
              <MaterialIcon name={view === 'table' ? 'grid_view' : 'table_rows'} />
              {view === 'table' ? 'Grid View' : 'Table View'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => exportData('csv')}
              title="Export CSV"
              aria-label="Export CSV"
            >
              <MaterialIcon name="table_view" />
              Export CSV
            </Button>
            <Button
              variant="secondary"
              onClick={() => exportData('excel')}
              title="Export Excel"
              aria-label="Export Excel"
            >
              <MaterialIcon name="table_chart" />
              Export Excel
            </Button>
            <Button
              variant="secondary"
              onClick={openImportModal}
              title="Import students"
              aria-label="Import students"
            >
              <MaterialIcon name="upload_file" />
              Import Students
            </Button>
            <Button
              variant="danger"
              onClick={() => setDeleteAllOpen(true)}
              title="Delete all students"
              aria-label="Delete all students"
            >
              <MaterialIcon name="delete_sweep" />
              Delete All
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!hasClassFilterForDelete) {
                  toast.error('Select faculty/department/class filter first')
                  return
                }
                setDeleteFilteredOpen(true)
              }}
              title="Delete students by selected class filters"
              aria-label="Delete students by selected class filters"
            >
              <MaterialIcon name="filter_alt_off" />
              Delete Filtered
            </Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
              <MaterialIcon name="add" />
              Add Student
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[340px,1fr]">
        <StudentFiltersPanel values={filters} options={optionsData} onChange={setFilter} onClear={clearFilters} />

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-[rgb(var(--text-muted))]">
                Showing <span className="font-semibold text-[rgb(var(--text))]">{rows.length}</span> of{' '}
                <span className="font-semibold text-[rgb(var(--text))]">{pagination.total}</span> students
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[rgb(var(--text-muted))]">Per page</span>
                <select
                  className="rounded-lg border border-black/5 bg-[rgb(var(--panel))]/70 px-2 py-1.5 text-sm dark:border-white/10"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value))
                    setPage(1)
                  }}
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {activeTags.length ? (
            <div className="flex flex-wrap gap-2">
              {activeTags.map((tag) => (
                <button
                  type="button"
                  key={tag.key}
                  onClick={tag.clear}
                  className="rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary"
                  title="Remove filter"
                >
                  {tag.label} x
                </button>
              ))}
            </div>
          ) : null}

          {rows.length ? (
            view === 'table' ? (
              <Card className="p-4">
                <DataTable columns={columns} data={rows} className="max-h-[52vh]" />
              </Card>
            ) : (
              <div className="grid max-h-[52vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                {rows.map((student) => (
                  <StudentCard
                    key={student._id}
                    student={student}
                    onEdit={(s) => {
                      setEditing(s)
                      setFormOpen(true)
                    }}
                    onDelete={(s) => setDeleteTarget(s)}
                  />
                ))}
              </div>
            )
          ) : (
            <EmptyState
              title="No students found"
              message="Adjust filters or add your first student."
              right={
                <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
                  <MaterialIcon name="add" />
                  Add Student
                </Button>
              }
            />
          )}

          <Card className="p-4">
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
          </Card>
        </div>
      </div>

      <StudentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initialData={editing}
        filtersData={optionsData}
        loading={createMut.isPending || updateMut.isPending}
        onSubmit={(payload) => {
          if (editing?._id) updateMut.mutate({ id: editing._id, payload })
          else createMut.mutate(payload)
        }}
      />

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Students (Excel)"
        description="Select one faculty/department/class/batch. Every row in the uploaded file will be inserted into that same class and batch."
        className="max-h-[88vh] overflow-y-auto"
        containerClassName="w-[min(900px,96vw)]"
      >
        <form className="space-y-4" onSubmit={submitImport}>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Faculty"
              value={importForm.facultyId}
              onChange={(e) => {
                updateImport('facultyId', e.target.value)
                updateImport('departmentId', '')
                updateImport('classId', '')
              }}
            >
              <option value="">Select faculty</option>
              {(optionsData.faculties || []).map((f) => (
                <option key={f._id} value={f._id}>
                  {f.facultyName}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Department"
              value={importForm.departmentId}
              onChange={(e) => {
                updateImport('departmentId', e.target.value)
                updateImport('classId', '')
              }}
            >
              <option value="">Select department</option>
              {importDepartments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.departmentName}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Class"
              value={importForm.classId}
              onChange={(e) => updateImport('classId', e.target.value)}
            >
              <option value="">Select class</option>
              {importClasses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.className}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Batch"
              value={importForm.batchId}
              onChange={(e) => updateImport('batchId', e.target.value)}
            >
              <option value="">Select batch</option>
              {(optionsData.batches || []).map((b) => (
                <option key={b._id} value={b._id}>
                  {b.batchName} ({b.year})
                </option>
              ))}
            </SelectField>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Excel File (.xlsx)</span>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => updateImport('file', e.target.files?.[0] || null)}
              className="w-full rounded-xl border border-black/5 bg-[rgb(var(--panel))]/70 px-3 py-2.5 text-sm dark:border-white/10"
            />
            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
              Template columns: studentId (required), name (required), gender, email, phoneNumber, jobName, description.
            </p>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={downloadImportTemplate}>
              <MaterialIcon name="download" />
              Download Sample Excel
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setImportOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={importMut.isPending}
                title={importMut.isPending ? 'Importing students' : 'Import students'}
                aria-label={importMut.isPending ? 'Importing students' : 'Import students'}
              >
                <MaterialIcon
                  name={importMut.isPending ? 'sync' : 'upload_file'}
                  className={importMut.isPending ? 'animate-spin' : undefined}
                />
                {importMut.isPending ? 'Importing...' : 'Import Students'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteFilteredOpen}
        onClose={() => setDeleteFilteredOpen(false)}
        title="Delete Filtered Students"
        description="Deletes students that match your selected faculty/department/class filters."
      >
        <p className="text-sm text-[rgb(var(--text-muted))]">
          Matching classes: <span className="font-semibold text-[rgb(var(--text))]">{filters.classIds.length || 0}</span>
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteFilteredOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => deleteFilteredMut.mutate({ force: false })}
            disabled={deleteFilteredMut.isPending}
            title="Soft delete filtered students"
            aria-label="Soft delete filtered students"
          >
            <MaterialIcon name={deleteFilteredMut.isPending ? 'sync' : 'delete_outline'} className={deleteFilteredMut.isPending ? 'animate-spin' : undefined} />
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteFilteredMut.mutate({ force: true })}
            disabled={deleteFilteredMut.isPending}
            title="Permanently delete filtered students"
            aria-label="Permanently delete filtered students"
          >
            <MaterialIcon name={deleteFilteredMut.isPending ? 'sync' : 'delete_forever'} className={deleteFilteredMut.isPending ? 'animate-spin' : undefined} />
          </Button>
        </div>
      </Modal>

      <Modal
        open={deleteAllOpen}
        onClose={() => setDeleteAllOpen(false)}
        title="Delete All Students"
        description="Choose soft delete or permanent delete for all student records."
      >
        <p className="text-sm text-[rgb(var(--text-muted))]">
          This action affects every student in your database.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteAllOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => deleteAllMut.mutate({ force: false })}
            disabled={deleteAllMut.isPending}
            title="Soft delete all students"
            aria-label="Soft delete all students"
          >
            <MaterialIcon name={deleteAllMut.isPending ? 'sync' : 'delete_outline'} className={deleteAllMut.isPending ? 'animate-spin' : undefined} />
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteAllMut.mutate({ force: true })}
            disabled={deleteAllMut.isPending}
            title="Permanently delete all students"
            aria-label="Permanently delete all students"
          >
            <MaterialIcon name={deleteAllMut.isPending ? 'sync' : 'delete_forever'} className={deleteAllMut.isPending ? 'animate-spin' : undefined} />
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Student"
        description="Choose soft delete or permanent delete."
      >
        <p className="text-sm text-[rgb(var(--text-muted))]">
          Student: <span className="font-semibold text-[rgb(var(--text))]">{deleteTarget?.name}</span>
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => deleteMut.mutate({ id: deleteTarget?._id, force: false })}
            title="Soft delete"
            aria-label="Soft delete student"
          >
            <MaterialIcon name="delete_outline" />
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteMut.mutate({ id: deleteTarget?._id, force: true })}
            title="Permanent delete"
            aria-label="Permanently delete student"
          >
            <MaterialIcon name="delete_forever" />
          </Button>
        </div>
      </Modal>
    </div>
  )
}
