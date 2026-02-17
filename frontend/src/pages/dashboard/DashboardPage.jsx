import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import ChartCard from '../../components/charts/ChartCard'
import NoChartData from '../../components/charts/NoChartData'
import Button from '../../components/common/Button'
import MaterialIcon from '../../components/common/MaterialIcon'
import { alumniService } from '../../services/alumniService'
import Skeleton from '../../components/common/Skeleton'
import { formatNumber } from '../../utils/format'

const genderPalette = ['#1c9d56', '#31a5d6', '#f59e0b', '#e11d48']

function QuickActions() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Link to="/students">
        <Button className="w-full justify-center !rounded-full">
          <MaterialIcon name="school" />
          Manage Students
        </Button>
      </Link>
      <Link to="/analytics">
        <Button variant="secondary" className="w-full justify-center !rounded-full">
          <MaterialIcon name="analytics" />
          Open Analytics Hub
        </Button>
      </Link>
      <Link to="/reports">
        <Button variant="ghost" className="w-full justify-center !rounded-full">
          <MaterialIcon name="description" />
          Generate Reports
        </Button>
      </Link>
      <Link to="/settings">
        <Button variant="ghost" className="w-full justify-center !rounded-full">
          <MaterialIcon name="settings" />
          Open Settings
        </Button>
      </Link>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => alumniService.getDashboard({ startYear: 2020, endYear: 2025 }),
  })

  const payload = data?.data

  const statCards = useMemo(() => {
    const t = payload?.totals || {}
    const totalStudents = Number(t.totalStudents || 0)
    const totalEmployed = Number(t.totalEmployed || 0)
    const totalUnemployed =
      t.totalUnemployed !== undefined
        ? Number(t.totalUnemployed || 0)
        : Math.max(totalStudents - totalEmployed, 0)
    const employmentRate =
      t.employmentRate !== undefined
        ? Number(t.employmentRate || 0)
        : totalStudents
          ? Number(((totalEmployed / totalStudents) * 100).toFixed(1))
          : 0

    return [
      { title: 'Total Students', value: formatNumber(totalStudents), accent: 'primary' },
      { title: 'Total Employed', value: formatNumber(totalEmployed), accent: 'secondary' },
      { title: 'Total Unemployed', value: formatNumber(totalUnemployed), accent: 'primary' },
      {
        title: 'Employment Rate',
        value: `${employmentRate.toFixed(1)}%`,
        hint: 'Employed / Total Students',
        accent: 'secondary',
      },
      { title: 'Total Faculties', value: formatNumber(t.totalFaculties || 0), accent: 'primary' },
      { title: 'Total Departments', value: formatNumber(t.totalDepartments || 0), accent: 'secondary' },
      { title: 'Total Batches', value: formatNumber(t.totalBatches || 0), accent: 'primary' },
      { title: 'Total Classes', value: formatNumber(t.totalClasses || 0), accent: 'secondary' },
    ]
  }, [payload])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Main overview of graduates, employment outcomes, and academic segmentation."
      />

      <QuickActions />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: statCards.length }).map((_, i) => <Skeleton key={i} className="h-32" />)
          : statCards.map((item) => <StatCard key={item.title} {...item} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Students Per Batch (2020-2025)" subtitle="Bar chart">
          {payload?.charts?.studentsPerBatch?.length ? (
            <div className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payload.charts.studentsPerBatch}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="year" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1c9d56" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <NoChartData />
          )}
        </ChartCard>

        <ChartCard title="Gender Distribution" subtitle="Pie chart">
          {payload?.charts?.genderDistribution?.length ? (
            <div className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={payload.charts.genderDistribution}
                    dataKey="count"
                    nameKey="gender"
                    outerRadius={95}
                    label
                  >
                    {payload.charts.genderDistribution.map((entry, index) => (
                      <Cell
                        key={`${entry.gender}-${index}`}
                        fill={genderPalette[index % genderPalette.length]}
                      />
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
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Employed vs Unemployed by Batch" subtitle="Stacked bar chart">
          {payload?.charts?.employedVsUnemployedPerBatch?.length ? (
            <div className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payload.charts.employedVsUnemployedPerBatch}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="year" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="employed" stackId="status" fill="#1c9d56" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="unemployed" stackId="status" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <NoChartData />
          )}
        </ChartCard>

        <ChartCard title="Employment Trends Over Years" subtitle="Line chart">
          {payload?.charts?.employmentTrend?.length ? (
            <div className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={payload.charts.employmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="year" />
                  <YAxis unit="%" />
                  <Tooltip />
                  <Line type="monotone" dataKey="employedRate" stroke="#31a5d6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <NoChartData />
          )}
        </ChartCard>
      </section>
    </div>
  )
}
