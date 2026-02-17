/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import Modal from '../common/Modal'
import Input from '../common/Input'
import SelectField from '../common/Select'
import Textarea from '../common/Textarea'
import Button from '../common/Button'
import MaterialIcon from '../common/MaterialIcon'

const EMPTY_LIST = []

const steps = [
  { id: 1, label: 'Personal' },
  { id: 2, label: 'Academic' },
  { id: 3, label: 'Employment' },
  { id: 4, label: 'Notes' },
]

const initialState = {
  studentId: '',
  name: '',
  email: '',
  phoneNumber: '',
  gender: 'Male',
  photo: null,
  photoImage: '',
  facultyId: '',
  departmentId: '',
  classId: '',
  batchId: '',
  isEmployed: true,
  jobId: '',
  description: '',
}

function resolveInitialValues(data) {
  if (!data) return initialState
  const facultyId = data.classId?.departmentId?.facultyId?._id || ''
  const departmentId = data.classId?.departmentId?._id || ''
  const classId = data.classId?._id || data.classId || ''
  const batchId = data.batchId?._id || data.batchId || ''
  const jobId = data.jobId?._id || data.jobId || ''
  return {
    ...initialState,
    studentId: data.studentId ? String(data.studentId) : '',
    name: data.name || '',
    email: data.email || '',
    phoneNumber: data.phoneNumber || '',
    gender: data.gender || 'Male',
    photoImage: data.photoImage || '',
    facultyId,
    departmentId,
    classId,
    batchId,
    isEmployed: Boolean(jobId),
    jobId: jobId || '',
    description: data.description || '',
  }
}

export default function StudentFormModal({
  open,
  onClose,
  onSubmit,
  loading,
  initialData,
  filtersData,
}) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialState)

  useEffect(() => {
    if (!open) return
    setStep(1)
    setForm(resolveInitialValues(initialData))
  }, [open, initialData])

  const faculties = filtersData?.faculties ?? EMPTY_LIST
  const departments = filtersData?.departments ?? EMPTY_LIST
  const classes = filtersData?.classes ?? EMPTY_LIST
  const batches = filtersData?.batches ?? EMPTY_LIST
  const jobs = filtersData?.jobs ?? EMPTY_LIST

  const filteredDepartments = useMemo(() => {
    if (!form.facultyId) return departments
    return departments.filter((d) => String(d.facultyId) === String(form.facultyId))
  }, [departments, form.facultyId])

  const filteredClasses = useMemo(() => {
    if (!form.departmentId) return classes
    return classes.filter((c) => String(c.departmentId) === String(form.departmentId))
  }, [classes, form.departmentId])

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function nextStep() {
    setStep((s) => Math.min(4, s + 1))
  }

  function prevStep() {
    setStep((s) => Math.max(1, s - 1))
  }

  function canContinue() {
    if (step === 1) return Boolean(/^\d+$/.test(form.studentId.trim()) && form.name.trim() && form.gender)
    if (step === 2) return Boolean(form.classId && form.batchId)
    if (step === 3) return form.isEmployed ? Boolean(form.jobId) : true
    return true
  }

  function submitForm(e) {
    e.preventDefault()
    if (!/^\d+$/.test(form.studentId.trim())) return
    if (!form.name.trim()) return
    if (!form.classId || !form.batchId) return

    onSubmit({
      studentId: form.studentId.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      gender: form.gender,
      classId: form.classId,
      batchId: form.batchId,
      jobId: form.isEmployed ? form.jobId : '',
      description: form.description.trim(),
      ...(form.photo ? { photo: form.photo } : {}),
    })
  }

  const previewUrl = form.photo ? URL.createObjectURL(form.photo) : form.photoImage || ''

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? 'Edit Student' : 'Add Student'}
      description="Multi-step student profile form"
      className="max-h-[88vh] overflow-y-auto"
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {steps.map((s) => (
          <div
            key={s.id}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              s.id === step
                ? 'bg-primary text-white'
                : s.id < step
                  ? 'bg-secondary/15 text-secondary'
                  : 'bg-[rgb(var(--muted))] text-[rgb(var(--text-muted))]'
            }`}
          >
            {s.id}. {s.label}
          </div>
        ))}
      </div>

      <form onSubmit={submitForm} className="space-y-4">
        {step === 1 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Student ID"
              type="number"
              min="1"
              step="1"
              value={form.studentId}
              onChange={(e) => update('studentId', e.target.value)}
              placeholder="e.g. 453"
            />
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Student full name"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="student@example.com"
            />
            <Input
              label="Phone Number"
              value={form.phoneNumber}
              onChange={(e) => update('phoneNumber', e.target.value)}
              placeholder="+252..."
            />
            <SelectField
              label="Gender"
              value={form.gender}
              onChange={(e) => update('gender', e.target.value)}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </SelectField>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Photo Upload</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => update('photo', e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-black/5 bg-[rgb(var(--panel))]/70 px-3 py-2.5 text-sm dark:border-white/10"
              />
            </label>
            {previewUrl ? (
              <div className="sm:col-span-2">
                <img
                  src={previewUrl}
                  alt="Student preview"
                  className="h-24 w-24 rounded-xl border border-black/10 object-cover dark:border-white/10"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Faculty"
              value={form.facultyId}
              onChange={(e) => {
                const next = e.target.value
                update('facultyId', next)
                update('departmentId', '')
                update('classId', '')
              }}
            >
              <option value="">Select faculty</option>
              {faculties.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.facultyName}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Department"
              value={form.departmentId}
              onChange={(e) => {
                const next = e.target.value
                update('departmentId', next)
                update('classId', '')
              }}
            >
              <option value="">Select department</option>
              {filteredDepartments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.departmentName}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Class"
              value={form.classId}
              onChange={(e) => update('classId', e.target.value)}
            >
              <option value="">Select class</option>
              {filteredClasses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.className}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Batch"
              value={form.batchId}
              onChange={(e) => update('batchId', e.target.value)}
            >
              <option value="">Select batch</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.batchName} ({b.year})
                </option>
              ))}
            </SelectField>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  form.isEmployed ? 'bg-primary text-white' : 'bg-[rgb(var(--muted))]'
                }`}
                onClick={() => update('isEmployed', true)}
              >
                Employed
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  !form.isEmployed ? 'bg-secondary text-white' : 'bg-[rgb(var(--muted))]'
                }`}
                onClick={() => update('isEmployed', false)}
              >
                Unemployed
              </button>
            </div>
            {form.isEmployed ? (
              <SelectField
                label="Job"
                value={form.jobId}
                onChange={(e) => update('jobId', e.target.value)}
              >
                <option value="">Select job</option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.jobName}
                  </option>
                ))}
              </SelectField>
            ) : (
              <p className="text-sm text-[rgb(var(--text-muted))]">
                Student will be marked as unemployed.
              </p>
            )}
          </div>
        ) : null}

        {step === 4 ? (
          <Textarea
            label="Description / Notes"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Timeline notes, achievements, or follow-ups."
          />
        ) : null}

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={step === 1 ? onClose : prevStep}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step < 4 ? (
            <Button type="button" onClick={nextStep} disabled={!canContinue()}>
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={loading}>
              <MaterialIcon
                name={loading ? 'sync' : initialData ? 'save' : 'person_add'}
                className={loading ? 'animate-spin' : undefined}
              />
              {loading ? 'Saving...' : initialData ? 'Save Student' : 'Create Student'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}
