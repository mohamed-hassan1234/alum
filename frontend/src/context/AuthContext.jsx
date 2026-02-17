/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { getErrorMessage } from '../utils/http'

const AuthContext = createContext(null)

const TOKEN_KEY = 'ams_token'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      if (!token) {
        setAdmin(null)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const res = await api.get('/auth/me')
        if (!cancelled) setAdmin(res.data.admin)
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        if (!cancelled) {
          setToken('')
          setAdmin(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [token])

  async function login({ email, password }) {
    try {
      const res = await api.post('/auth/login', { email, password })
      const nextToken = res.data.token
      localStorage.setItem(TOKEN_KEY, nextToken)
      setToken(nextToken)
      setAdmin(res.data.admin)
      toast.success('Logged in')
      return true
    } catch (err) {
      toast.error(getErrorMessage(err))
      return false
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken('')
    setAdmin(null)
    toast.info('Logged out')
  }

  function setAdminData(nextAdmin) {
    setAdmin(nextAdmin || null)
  }

  const value = useMemo(() => {
    return {
      token,
      admin,
      isAuthenticated: Boolean(token),
      loading,
      login,
      logout,
      setAdminData,
    }
  }, [token, admin, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
