export function getErrorMessage(err) {
  if (!err) return 'Something went wrong'
  const data = err.response?.data
  if (typeof data?.message === 'string') return data.message
  if (typeof err.message === 'string') return err.message
  return 'Request failed'
}

export function buildQuery(params) {
  const sp = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (Array.isArray(v)) {
      if (!v.length) return
      v.forEach((item) => {
        if (item !== undefined && item !== null && String(item).trim() !== '') {
          sp.append(k, String(item))
        }
      })
      return
    }
    const s = String(v)
    if (s.trim() === '') return
    sp.set(k, s)
  })
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

