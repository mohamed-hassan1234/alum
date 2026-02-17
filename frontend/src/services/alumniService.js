import { api } from './api'
import { buildQuery } from '../utils/http'

function toFormData(payload) {
  const fd = new FormData()
  Object.entries(payload || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (v instanceof File) {
      fd.append(k, v)
      return
    }
    fd.append(k, String(v))
  })
  return fd
}

async function get(path) {
  const res = await api.get(path)
  return res.data
}

async function post(path, data, config) {
  const res = await api.post(path, data, config)
  return res.data
}

async function put(path, data, config) {
  const res = await api.put(path, data, config)
  return res.data
}

async function del(path) {
  const res = await api.delete(path)
  return res.data
}

export const alumniService = {
  register: (payload) => post('/auth/register', payload),
  login: (payload) => post('/auth/login', payload),
  me: () => get('/auth/me'),

  getDashboard: (params = {}) => get(`/analytics/dashboard${buildQuery(params)}`),
  getAnalyticsHub: (params = {}) => get(`/analytics/hub${buildQuery(params)}`),

  getFaculties: () => get('/faculties'),
  createFaculty: (payload) => post('/faculties', payload),
  updateFaculty: (id, payload) => put(`/faculties/${id}`, payload),
  deleteFaculty: (id) => del(`/faculties/${id}`),

  getDepartments: (params = {}) => get(`/departments${buildQuery(params)}`),
  createDepartment: (payload) => post('/departments', payload),
  updateDepartment: (id, payload) => put(`/departments/${id}`, payload),
  deleteDepartment: (id) => del(`/departments/${id}`),

  getClasses: (params = {}) => get(`/classes${buildQuery(params)}`),
  createClass: (payload) => post('/classes', payload),
  updateClass: (id, payload) => put(`/classes/${id}`, payload),
  deleteClass: (id) => del(`/classes/${id}`),

  getBatches: () => get('/batches'),
  createBatch: (payload) => post('/batches', payload),
  updateBatch: (id, payload) => put(`/batches/${id}`, payload),
  deleteBatch: (id) => del(`/batches/${id}`),

  getJobs: () => get('/jobs'),
  createJob: (payload) => post('/jobs', payload),
  updateJob: (id, payload) => put(`/jobs/${id}`, payload),
  deleteJob: (id) => del(`/jobs/${id}`),

  getStudentFilters: () => get('/students/filters'),
  downloadStudentImportTemplate: async () => {
    const res = await api.get('/students/import-template', { responseType: 'blob' })
    return res
  },
  importStudentsBulk: async ({ file, facultyId, departmentId, classId, batchId }) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('facultyId', String(facultyId))
    fd.append('departmentId', String(departmentId))
    fd.append('classId', String(classId))
    fd.append('batchId', String(batchId))
    const res = await api.post('/students/import', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
  getStudents: (params = {}) => get(`/students${buildQuery(params)}`),
  getStudent: (id) => get(`/students/${id}`),
  createStudent: (payload) =>
    post('/students', toFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateStudent: (id, payload) =>
    put(`/students/${id}`, toFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteStudent: (id, force = false) => del(`/students/${id}${force ? '?force=true' : ''}`),
  restoreStudent: (id) => post(`/students/${id}/restore`, {}),

  updateAdminProfile: (payload) => {
    if (payload?.photo && (payload.photo instanceof File || payload.photo instanceof Blob)) {
      // Let the browser set multipart boundaries automatically.
      return put('/admin/me', toFormData(payload))
    }
    return put('/admin/me', payload)
  },
  changePassword: (payload) => put('/admin/change-password', payload),

  exportStudents: async (format = 'csv', params = {}) => {
    const res = await api.get(`/reports/students${buildQuery({ ...params, format })}`, {
      responseType: 'blob',
    })
    return res
  },
  backupData: async () => {
    const res = await api.get('/settings/backup', { responseType: 'blob' })
    return res
  },
}
