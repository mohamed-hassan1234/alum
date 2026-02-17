import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import StudentFiltersPanel from '../../components/filters/StudentFiltersPanel'
import ChartCard from '../../components/charts/ChartCard'
import NoChartData from '../../components/charts/NoChartData'
import MaterialIcon from '../../components/common/MaterialIcon'
import { alumniService } from '../../services/alumniService'
import { getErrorMessage } from '../../utils/http'
import { useDebounce } from '../../hooks/useDebounce'

const defaultFilters = {
  facultyIds: [],
  departmentIds: [],
  classIds: [],
  batchYears: [],
  jobIds: [],
  genders: [],
  employmentStatus: 'all',
  search: '',
  dateFrom: '',
  dateTo: '',
}

const piePalette = ['#1c9d56', '#31a5d6', '#f59e0b', '#e11d48']

export default function AnalyticsHubPage() {
  const chartSectionRef = useRef(null)
  const [filters, setFilters] = useState(defaultFilters)
  const debouncedSearch = useDebounce(filters.search, 400)

  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const filterOptionsQ = useQuery({
    queryKey: ['student-filters'],
    queryFn: alumniService.getStudentFilters,
  })

  const hubQueryParams = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
    }),
    [filters, debouncedSearch]
  )

  const hubQ = useQuery({
    queryKey: ['analytics-hub', hubQueryParams],
    queryFn: () => alumniService.getAnalyticsHub(hubQueryParams),
  })

  const payload = hubQ.data?.data || {
    genderDistribution: [],
    employmentByGender: [],
    batchGenderRatio: [],
    jobsByGender: [],
    facultyStats: [],
    departmentStats: [],
  }

  async function exportChartsAsPng() {
    try {
      if (!chartSectionRef.current) return
      const dataUrl = await toPng(chartSectionRef.current, { cacheBust: true, pixelRatio: 2 })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'analytics-hub.png'
      a.click()
      toast.success('Charts exported as PNG')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  async function exportChartsAsPdf() {
    try {
      if (!chartSectionRef.current) return
      const dataUrl = await toPng(chartSectionRef.current, { cacheBust: true, pixelRatio: 2 })
      const pdf = new jsPDF('l', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const imgWidth = pageWidth - 10
      pdf.addImage(dataUrl, 'PNG', 5, 5, imgWidth, 0)
      pdf.save('analytics-hub.pdf')
      toast.success('Charts exported as PDF')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advanced Analytics Hub"
        subtitle="Interactive insights with faculty, department, class, batch, gender, and employment filters."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={exportChartsAsPng}
              title="Export PNG"
              aria-label="Export PNG"
              className="w-full sm:w-auto"
            >
              <MaterialIcon name="image" />
              Export PNG
            </Button>
            <Button
              variant="secondary"
              onClick={exportChartsAsPdf}
              title="Export PDF"
              aria-label="Export PDF"
              className="w-full sm:w-auto"
            >
              <MaterialIcon name="picture_as_pdf" />
              Export PDF
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[340px,1fr]">
        <div className="space-y-4">
          <StudentFiltersPanel
            values={filters}
            options={filterOptionsQ.data?.data || {}}
            onChange={setFilter}
            onClear={() => setFilters(defaultFilters)}
          />
          <Card className="p-4">
            <h3 className="mb-3 font-display text-base font-semibold">Date Range</h3>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">From</span>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilter('dateFrom', e.target.value)}
                  className="w-full rounded-xl border border-black/5 bg-[rgb(var(--panel))]/70 px-3 py-2 text-sm dark:border-white/10"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">To</span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilter('dateTo', e.target.value)}
                  className="w-full rounded-xl border border-black/5 bg-[rgb(var(--panel))]/70 px-3 py-2 text-sm dark:border-white/10"
                />
              </label>
            </div>
          </Card>
        </div>

        <div ref={chartSectionRef} className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Gender Distribution" subtitle="Pie chart with filters">
              {payload.genderDistribution.length ? (
                <div className="h-[290px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={payload.genderDistribution} dataKey="count" nameKey="gender" label outerRadius={95}>
                        {payload.genderDistribution.map((entry, i) => (
                          <Cell key={`${entry.gender}-${i}`} fill={piePalette[i % piePalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <NoChartData />
              )}
            </ChartCard>

            <ChartCard title="Employment Rate by Gender" subtitle="Comparative bars">
              {payload.employmentByGender.length ? (
                <div className="h-[290px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={payload.employmentByGender}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis dataKey="gender" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="employed" fill="#1c9d56" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="unemployed" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <NoChartData />
              )}
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Batch-wise Gender Ratio" subtitle="Stacked bar chart">
              {payload.batchGenderRatio.length ? (
                <div className="h-[290px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={payload.batchGenderRatio}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis dataKey="year" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Male" stackId="gender" fill="#31a5d6" />
                      <Bar dataKey="Female" stackId="gender" fill="#1c9d56" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <NoChartData />
              )}
            </ChartCard>

            <ChartCard title="Job Distribution by Gender" subtitle="Top jobs">
              {payload.jobsByGender.length ? (
                <div className="h-[290px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={payload.jobsByGender.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis dataKey="jobName" angle={-22} textAnchor="end" interval={0} height={60} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Male" fill="#31a5d6" />
                      <Bar dataKey="Female" fill="#1c9d56" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <NoChartData />
              )}
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Faculty-wise Statistics">
              {payload.facultyStats.length ? (
                <div className="h-[290px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={payload.facultyStats}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis dataKey="facultyName" angle={-22} textAnchor="end" interval={0} height={60} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="#31a5d6" />
                      <Bar dataKey="employed" fill="#1c9d56" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <NoChartData />
              )}
            </ChartCard>

            <ChartCard title="Department Diversity Metrics">
              {payload.departmentStats.length ? (
                <div className="h-[290px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={payload.departmentStats.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis dataKey="departmentName" angle={-22} textAnchor="end" interval={0} height={60} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="#31a5d6" />
                      <Bar dataKey="unemployed" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <NoChartData />
              )}
            </ChartCard>
          </div>
        </div>
      </div>
    </div>
  )
}
