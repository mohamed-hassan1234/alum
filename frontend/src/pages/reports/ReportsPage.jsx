import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import StudentFiltersPanel from '../../components/filters/StudentFiltersPanel'
import StatCard from '../../components/common/StatCard'
import MaterialIcon from '../../components/common/MaterialIcon'
import { alumniService } from '../../services/alumniService'
import { readFilenameFromHeaders, saveBlob } from '../../utils/download'
import { getErrorMessage } from '../../utils/http'

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

export default function ReportsPage() {
  const [filters, setFilters] = useState(defaultFilters)
  const [includeCharts, setIncludeCharts] = useState(true)
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleFrequency, setScheduleFrequency] = useState('weekly')

  const filterOptionsQ = useQuery({
    queryKey: ['student-filters'],
    queryFn: alumniService.getStudentFilters,
  })

  const hubQ = useQuery({
    queryKey: ['report-summary', filters],
    queryFn: () => alumniService.getAnalyticsHub(filters),
  })

  const summary = useMemo(() => {
    const data = hubQ.data?.data
    const byGender = data?.employmentByGender || []
    const employed = byGender.reduce((sum, row) => sum + (row.employed || 0), 0)
    const unemployed = byGender.reduce((sum, row) => sum + (row.unemployed || 0), 0)
    return {
      total: employed + unemployed,
      employed,
      unemployed,
      departments: data?.departmentStats?.length || 0,
    }
  }, [hubQ.data])

  async function exportReport(format) {
    try {
      const res = await alumniService.exportStudents(format, filters)
      const ext = format === 'excel' ? 'xlsx' : format
      const filename = readFilenameFromHeaders(res.headers, `students-report.${ext}`)
      saveBlob(res.data, filename)
      toast.success(`Report exported as ${format.toUpperCase()}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Export"
        subtitle="Generate filtered student reports in PDF, CSV, and Excel formats."
      />

      <div className="grid gap-4 xl:grid-cols-[340px,1fr]">
        <StudentFiltersPanel
          values={filters}
          options={filterOptionsQ.data?.data || {}}
          onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          onClear={() => setFilters(defaultFilters)}
        />

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Students" value={summary.total} />
            <StatCard title="Employed" value={summary.employed} accent="secondary" />
            <StatCard title="Unemployed" value={summary.unemployed} />
            <StatCard title="Departments Covered" value={summary.departments} accent="secondary" />
          </div>

          <Card className="p-5">
            <h3 className="font-display text-lg font-semibold">Export Options</h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <label className="flex items-center gap-2 rounded-xl border border-black/5 bg-[rgb(var(--muted))]/40 p-3 text-sm dark:border-white/10">
                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                />
                Include charts (frontend preview option)
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-black/5 bg-[rgb(var(--muted))]/40 p-3 text-sm dark:border-white/10">
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={(e) => setScheduleEnabled(e.target.checked)}
                />
                Enable scheduled report (bonus)
              </label>
              {scheduleEnabled ? (
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold">Frequency</span>
                  <select
                    value={scheduleFrequency}
                    onChange={(e) => setScheduleFrequency(e.target.value)}
                    className="w-full rounded-xl border border-black/5 bg-[rgb(var(--panel))]/70 px-3 py-2 dark:border-white/10"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-[rgb(var(--text-muted))]">
              Scheduled report configuration is UI-ready; backend scheduler can be connected later.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => exportReport('csv')}
                title="Export CSV"
                aria-label="Export CSV"
              >
                <MaterialIcon name="table_view" />
                Export CSV
              </Button>
              <Button
                variant="secondary"
                onClick={() => exportReport('excel')}
                title="Export Excel"
                aria-label="Export Excel"
              >
                <MaterialIcon name="table_chart" />
                Export Excel
              </Button>
              <Button
                variant="secondary"
                onClick={() => exportReport('pdf')}
                title="Export PDF"
                aria-label="Export PDF"
              >
                <MaterialIcon name="picture_as_pdf" />
                Export PDF
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
