import axios from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || 'https://alumni.nidwa.com/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ams_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
