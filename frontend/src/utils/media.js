import { API_BASE_URL } from '../services/api'

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/i, '')

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function getInitials(name) {
  const text = String(name || 'Admin').trim()
  if (!text) return 'A'
  const words = text.split(/\s+/).filter(Boolean)
  const first = words[0]?.[0] || 'A'
  const second = words[1]?.[0] || ''
  return `${first}${second}`.toUpperCase()
}

export function initialsAvatar(name = 'Admin') {
  const initials = escapeXml(getInitials(name))
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="64" fill="#7ab83f" />
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="700" fill="#ffffff">
        ${initials}
      </text>
    </svg>
  `
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function resolveMediaUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  if (/^(https?:)?\/\//i.test(raw)) return raw
  if (/^(data:image\/|blob:)/i.test(raw)) return raw

  const normalized = raw.replace(/\\/g, '/')
  const lower = normalized.toLowerCase()
  const uploadsIndex = lower.indexOf('/uploads/')

  if (uploadsIndex >= 0) {
    return `${API_ORIGIN}${normalized.slice(uploadsIndex)}`
  }
  if (lower.startsWith('uploads/')) {
    return `${API_ORIGIN}/${normalized}`
  }
  if (normalized.startsWith('/')) {
    return `${API_ORIGIN}${normalized}`
  }
  return normalized
}
