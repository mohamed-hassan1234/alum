import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/layouts/ProtectedRoute'
import AdminLayout from './components/layouts/AdminLayout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import FacultyPage from './pages/management/FacultyPage'
import DepartmentPage from './pages/management/DepartmentPage'
import ClassPage from './pages/management/ClassPage'
import BatchPage from './pages/management/BatchPage'
import JobPage from './pages/management/JobPage'
import StudentsPage from './pages/students/StudentsPage'
import StudentDetailsPage from './pages/students/StudentDetailsPage'
import AnalyticsHubPage from './pages/analytics/AnalyticsHubPage'
import ReportsPage from './pages/reports/ReportsPage'
import SettingsPage from './pages/settings/SettingsPage'
import NotFoundPage from './pages/errors/NotFoundPage'
import { useAuth } from './context/AuthContext'

function LoginRoute() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <LoginPage />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="faculties" element={<FacultyPage />} />
        <Route path="departments" element={<DepartmentPage />} />
        <Route path="classes" element={<ClassPage />} />
        <Route path="batches" element={<BatchPage />} />
        <Route path="jobs" element={<JobPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:id" element={<StudentDetailsPage />} />
        <Route path="analytics" element={<AnalyticsHubPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

