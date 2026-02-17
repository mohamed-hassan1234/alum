import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import Button from '../common/Button'
import MaterialIcon from '../common/MaterialIcon'
import { getCachedAdminPhoto, initialsAvatar, resolveMediaUrl } from '../../utils/media'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/faculties', label: 'Faculties', icon: 'account_balance' },
  { to: '/departments', label: 'Departments', icon: 'apartment' },
  { to: '/classes', label: 'Classes', icon: 'cast_for_education' },
  { to: '/batches', label: 'Batches', icon: 'calendar_month' },
  { to: '/jobs', label: 'Jobs', icon: 'work' },
  { to: '/students', label: 'Students', icon: 'school' },
  { to: '/analytics', label: 'Analytics Hub', icon: 'analytics' },
  { to: '/reports', label: 'Reports', icon: 'description' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

function formatRouteHeading(pathname) {
  const clean = String(pathname || '/dashboard')
    .replace(/^\/+/, '')
    .split('/')[0]
    .trim()
  if (!clean) return 'Dashboard'
  return clean
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function NavItem({ item, onClick }) {
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'group flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition',
          isActive
            ? '!rounded-full bg-primary text-white'
            : 'rounded-full text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--text))]'
        )
      }
    >
      <MaterialIcon name={item.icon} className="text-[18px]" />
      {item.label}
    </NavLink>
  )
}

function SidePanel({ mobile, open, onClose }) {
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <aside
      className={clsx(
        'z-40 flex h-dvh flex-col border-r border-black/5 bg-[rgb(var(--panel))]/90 p-4 backdrop-blur dark:border-white/10',
        mobile ? 'fixed inset-y-0 left-0 w-[86vw] max-w-[280px]' : 'fixed inset-y-0 left-0 w-[280px]'
      )}
      style={mobile ? { transform: open ? 'translateX(0)' : 'translateX(-110%)', transition: '0.25s ease' } : undefined}
    >
      <div className="flex h-[52px] items-center justify-between gap-3 border-b border-black/5 dark:border-white/10">
        <div className="min-w-0 leading-tight">
          <div className="font-display text-xl font-extrabold">Hormuud University</div>
          <div className="text-sm font-bold text-[rgb(var(--text-muted))]">
            Alumni management system
          </div>
        </div>
        {mobile ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--muted))]"
            aria-label="Close navigation"
          >
            <MaterialIcon name="close" />
          </button>
        ) : null}
      </div>

      <nav className="mt-5 space-y-1 overflow-y-auto pb-4">
        {navItems.map((item) => (
          <NavItem key={item.to} item={item} onClick={mobile ? onClose : undefined} />
        ))}
      </nav>

      <div className="mt-auto space-y-2 border-t border-black/5 pt-4 dark:border-white/10">
        <Button variant="ghost" className="w-full justify-start" onClick={toggleTheme}>
          {theme === 'dark' ? <MaterialIcon name="light_mode" /> : <MaterialIcon name="dark_mode" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Button>
        <Button variant="danger" className="w-full justify-start" onClick={logout}>
          <MaterialIcon name="logout" />
          Logout
        </Button>
      </div>
    </aside>
  )
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { admin } = useAuth()
  const location = useLocation()
  const sectionHeading = formatRouteHeading(location.pathname)
  const adminName = String(admin?.name || 'Admin').trim() || 'Admin'
  const adminFirstName = adminName.split(/\s+/)[0] || 'Admin'
  const cachedAvatar = getCachedAdminPhoto(admin?._id)
  const fallbackAvatar = initialsAvatar(adminName)
  const adminAvatar = resolveMediaUrl(cachedAvatar) || resolveMediaUrl(admin?.photoImage) || fallbackAvatar

  function handleAvatarError(e) {
    const currentSrc = String(e.currentTarget.src || '')
    const cachedSrc = resolveMediaUrl(cachedAvatar)
    if (cachedSrc && currentSrc !== cachedSrc) {
      e.currentTarget.src = cachedSrc
      return
    }
    e.currentTarget.onerror = null
    e.currentTarget.src = fallbackAvatar
  }

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen overflow-hidden text-[rgb(var(--text))]">
      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <SidePanel />
        </div>

        {mobileOpen ? (
          <button
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            aria-label="Close menu overlay"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
        <div className="lg:hidden">
          <SidePanel mobile open={mobileOpen} onClose={() => setMobileOpen(false)} />
        </div>

        <main className="flex min-h-screen min-w-0 flex-1 flex-col pb-4 pt-[76px] sm:pt-[80px] lg:ml-[280px]">
          <header className="fixed left-0 right-0 top-0 z-20 flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-black/5 bg-[rgb(var(--panel))]/95 px-4 backdrop-blur sm:px-6 lg:left-[280px] dark:border-white/10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg p-2 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--muted))] lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <MaterialIcon name="menu" />
              </button>
              <div className="min-w-0">
                <div className="truncate font-display text-sm font-semibold text-[rgb(var(--text-muted))]">
                  {sectionHeading}
                </div>
                <h2 className="truncate text-base font-bold">Welcome, {admin?.name || 'Admin'}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <img
                key={adminAvatar}
                src={adminAvatar}
                alt={adminName}
                onError={handleAvatarError}
                className="h-12 w-12 rounded-full border border-black/10 bg-white object-cover object-top dark:border-white/15"
              />
              <span className="hidden text-sm font-semibold text-[rgb(var(--text-muted))] sm:inline">
                {adminFirstName}
              </span>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
