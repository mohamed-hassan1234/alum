import { format } from 'date-fns'

export function formatDate(value, pattern = 'MMM dd, yyyy') {
  if (!value) return '-'
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '-'
  return format(date, pattern)
}

export function formatNumber(value) {
  const n = Number(value || 0)
  return n.toLocaleString()
}

export function toOptions(items, labelKey = 'name', valueKey = '_id') {
  return (items || []).map((item) => ({
    label: item[labelKey],
    value: item[valueKey],
  }))
}

