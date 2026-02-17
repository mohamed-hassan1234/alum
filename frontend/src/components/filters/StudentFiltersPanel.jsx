import { useMemo } from 'react'
import MultiSelectField from './MultiSelectField'
import Input from '../common/Input'
import Button from '../common/Button'

const EMPTY_LIST = []

function mapOptions(items, labelKey = 'name', valueKey = '_id') {
  return (items || []).map((item) => ({
    value: String(item[valueKey]),
    label: String(item[labelKey]),
  }))
}

export default function StudentFiltersPanel({ values, options, onChange, onClear }) {
  const faculties = options?.faculties ?? EMPTY_LIST
  const departments = options?.departments ?? EMPTY_LIST
  const classes = options?.classes ?? EMPTY_LIST
  const batches = options?.batches ?? EMPTY_LIST
  const jobs = options?.jobs ?? EMPTY_LIST

  const allDepartmentIds = useMemo(() => departments.map((d) => String(d._id)), [departments])

  const departmentOptions = useMemo(() => {
    if (!values.facultyIds.length) return departments
    return departments.filter((d) => values.facultyIds.includes(String(d.facultyId)))
  }, [departments, values.facultyIds])

  const effectiveDepartmentIds = useMemo(() => {
    if (values.departmentIds.length) return values.departmentIds
    if (values.facultyIds.length) return departmentOptions.map((d) => String(d._id))
    return allDepartmentIds
  }, [values.departmentIds, values.facultyIds, departmentOptions, allDepartmentIds])

  const classOptions = useMemo(() => {
    if (!effectiveDepartmentIds.length) return []
    return classes.filter((c) => effectiveDepartmentIds.includes(String(c.departmentId)))
  }, [classes, effectiveDepartmentIds])

  const batchYearOptions = useMemo(() => {
    const years = Array.from(new Set(batches.map((b) => String(b.year)))).sort()
    return years.map((y) => ({ label: y, value: y }))
  }, [batches])

  const selected = {
    faculties: mapOptions(faculties, 'facultyName').filter((o) => values.facultyIds.includes(o.value)),
    departments: mapOptions(departmentOptions, 'departmentName').filter((o) =>
      values.departmentIds.includes(o.value)
    ),
    classes: mapOptions(classOptions, 'className').filter((o) => values.classIds.includes(o.value)),
    batches: batchYearOptions.filter((o) => values.batchYears.includes(o.value)),
    jobs: mapOptions(jobs, 'jobName').filter((o) => values.jobIds.includes(o.value)),
  }

  function onMulti(key, list) {
    onChange(key, (list || []).map((x) => String(x.value)))
  }

  function handleFacultyChange(list) {
    const nextFacultyIds = (list || []).map((x) => String(x.value))
    onChange('facultyIds', nextFacultyIds)

    const allowedDepartmentIds = nextFacultyIds.length
      ? departments
          .filter((d) => nextFacultyIds.includes(String(d.facultyId)))
          .map((d) => String(d._id))
      : allDepartmentIds

    const nextDepartmentIds = values.departmentIds.filter((id) => allowedDepartmentIds.includes(String(id)))
    if (nextDepartmentIds.length !== values.departmentIds.length) {
      onChange('departmentIds', nextDepartmentIds)
    }

    const effectiveNextDepartmentIds = nextDepartmentIds.length
      ? nextDepartmentIds
      : nextFacultyIds.length
        ? allowedDepartmentIds
        : allDepartmentIds

    const allowedClassIds = classes
      .filter((c) => effectiveNextDepartmentIds.includes(String(c.departmentId)))
      .map((c) => String(c._id))

    const nextClassIds = values.classIds.filter((id) => allowedClassIds.includes(String(id)))
    if (nextClassIds.length !== values.classIds.length) {
      onChange('classIds', nextClassIds)
    }
  }

  function handleDepartmentChange(list) {
    const nextDepartmentIds = (list || []).map((x) => String(x.value))
    onChange('departmentIds', nextDepartmentIds)

    const fallbackDepartmentIds = values.facultyIds.length
      ? departments
          .filter((d) => values.facultyIds.includes(String(d.facultyId)))
          .map((d) => String(d._id))
      : allDepartmentIds

    const effectiveNextDepartmentIds = nextDepartmentIds.length
      ? nextDepartmentIds
      : fallbackDepartmentIds

    const allowedClassIds = classes
      .filter((c) => effectiveNextDepartmentIds.includes(String(c.departmentId)))
      .map((c) => String(c._id))

    const nextClassIds = values.classIds.filter((id) => allowedClassIds.includes(String(id)))
    if (nextClassIds.length !== values.classIds.length) {
      onChange('classIds', nextClassIds)
    }
  }

  function toggleGender(gender) {
    const set = new Set(values.genders)
    if (set.has(gender)) set.delete(gender)
    else set.add(gender)
    onChange('genders', Array.from(set))
  }

  return (
    <div className="space-y-4 rounded-2xl border border-black/5 bg-[rgb(var(--panel))]/70 p-4 dark:border-white/10">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-base font-semibold">Advanced Filters</h3>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear all
        </Button>
      </div>

      <Input
        label="Search Name / Email / Student ID"
        hint="Type a student name, email, or numeric student ID."
        value={values.search}
        onChange={(e) => onChange('search', e.target.value)}
        placeholder="e.g. Ahmed, ahmed@mail.com, 453"
      />

      <MultiSelectField
        label="Faculties"
        options={mapOptions(faculties, 'facultyName')}
        value={selected.faculties}
        onChange={handleFacultyChange}
      />
      <MultiSelectField
        label="Departments"
        options={mapOptions(departmentOptions, 'departmentName')}
        value={selected.departments}
        onChange={handleDepartmentChange}
      />
      <MultiSelectField
        label="Classes"
        options={mapOptions(classOptions, 'className')}
        value={selected.classes}
        onChange={(list) => onMulti('classIds', list)}
      />
      <MultiSelectField
        label="Batch Years"
        options={batchYearOptions}
        value={selected.batches}
        onChange={(list) => onMulti('batchYears', list)}
      />
      <MultiSelectField
        label="Jobs"
        options={mapOptions(jobs, 'jobName')}
        value={selected.jobs}
        onChange={(list) => onMulti('jobIds', list)}
      />

      <div>
        <span className="mb-2 block text-sm font-semibold">Gender</span>
        <div className="flex flex-wrap gap-2">
          {['Male', 'Female'].map((g) => {
            const active = values.genders.includes(g)
            return (
              <button
                type="button"
                key={g}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  active ? 'bg-primary text-white' : 'bg-[rgb(var(--muted))] text-[rgb(var(--text-muted))]'
                }`}
                onClick={() => toggleGender(g)}
              >
                {g}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-sm font-semibold">Employment Status</span>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'employed', label: 'Employed' },
            { key: 'unemployed', label: 'Unemployed' },
          ].map((s) => (
            <button
              key={s.key}
              type="button"
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                values.employmentStatus === s.key
                  ? 'bg-secondary text-white'
                  : 'bg-[rgb(var(--muted))] text-[rgb(var(--text-muted))]'
              }`}
              onClick={() => onChange('employmentStatus', s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
