import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import MaterialIcon from '../../components/common/MaterialIcon'
import { useAuth } from '../../context/AuthContext'
import { alumniService } from '../../services/alumniService'
import { getErrorMessage } from '../../utils/http'
import { readFilenameFromHeaders, saveBlob } from '../../utils/download'
import { initialsAvatar, resolveMediaUrl } from '../../utils/media'

const PREFERENCES_KEY = 'ams_preferences'

function getInitialPrefs() {
  const raw = localStorage.getItem(PREFERENCES_KEY)
  if (!raw) return { compactTables: false, defaultStudentPageSize: 25 }
  try {
    return JSON.parse(raw)
  } catch {
    return { compactTables: false, defaultStudentPageSize: 25 }
  }
}

export default function SettingsPage() {
  const { admin, setAdminData } = useAuth()
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    photo: null,
    photoPreview: '',
  })
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [prefs, setPrefs] = useState(getInitialPrefs)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingPassword, setEditingPassword] = useState(false)

  useEffect(() => {
    setProfile({
      name: admin?.name || '',
      email: admin?.email || '',
      photo: null,
      photoPreview: resolveMediaUrl(admin?.photoImage) || '',
    })
  }, [admin?.name, admin?.email, admin?.photoImage])

  const profileMut = useMutation({
    mutationFn: alumniService.updateAdminProfile,
    onSuccess: (payload) => {
      const nextAdmin = payload?.admin || {}
      const mergedAdmin = {
        _id: admin?._id,
        name: nextAdmin.name || profile.name.trim(),
        email: nextAdmin.email || profile.email.trim(),
        photoImage:
          resolveMediaUrl(nextAdmin.photoImage) ||
          profile.photoPreview ||
          resolveMediaUrl(admin?.photoImage) ||
          '',
      }
      setAdminData(mergedAdmin)
      setProfile((prev) => ({
        ...prev,
        name: mergedAdmin.name,
        email: mergedAdmin.email,
        photo: null,
        photoPreview: mergedAdmin.photoImage,
      }))
      setEditingProfile(false)
      toast.success('Profile updated')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const passwordMut = useMutation({
    mutationFn: alumniService.changePassword,
    onSuccess: () => {
      toast.success('Password changed')
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setEditingPassword(false)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  function savePreferences() {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs))
    toast.success('Preferences saved')
  }

  async function downloadBackup() {
    try {
      const res = await alumniService.backupData()
      const filename = readFilenameFromHeaders(res.headers, 'alumni-backup.json')
      saveBlob(res.data, filename)
      toast.success('Backup downloaded')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  function resetProfileEditor() {
    setProfile({
      name: admin?.name || '',
      email: admin?.email || '',
      photo: null,
      photoPreview: resolveMediaUrl(admin?.photoImage) || '',
    })
    setEditingProfile(false)
  }

  function handlePhotoSelect(file) {
    if (!file) {
      setProfile((prev) => ({
        ...prev,
        photo: null,
        photoPreview: resolveMediaUrl(admin?.photoImage) || '',
      }))
      return
    }

    // Set file immediately so Save always sends multipart payload.
    setProfile((prev) => ({ ...prev, photo: file }))

    const reader = new FileReader()
    reader.onload = () => {
      setProfile((prev) => ({
        ...prev,
        photo: file,
        photoPreview: String(reader.result || ''),
      }))
    }
    reader.readAsDataURL(file)
  }

  function onSubmitProfile(e) {
    e.preventDefault()
    const name = profile.name.trim()
    const email = profile.email.trim()

    if (!name) {
      toast.error('Name is required')
      return
    }
    if (!email) {
      toast.error('Email is required')
      return
    }

    const payload = {
      name,
      email,
      ...(profile.photo ? { photo: profile.photo } : {}),
    }
    profileMut.mutate(payload)
  }

  function onChangePassword(e) {
    e.preventDefault()
    if (!password.currentPassword || !password.newPassword) {
      toast.error('Both password fields are required')
      return
    }
    if (password.newPassword !== password.confirmPassword) {
      toast.error('Password confirmation does not match')
      return
    }
    passwordMut.mutate({
      currentPassword: password.currentPassword,
      newPassword: password.newPassword,
    })
  }

  const fallbackAvatar = initialsAvatar(admin?.name || 'Admin')
  const profileAvatar = resolveMediaUrl(profile.photoPreview || admin?.photoImage) || fallbackAvatar

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Update admin profile, security, preferences, and backup data."
      />

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-4">
              <img
                src={profileAvatar}
                alt={admin?.name || 'Admin profile'}
                onError={(e) => {
                  if (e.currentTarget.dataset.fallbackApplied === '1') return
                  e.currentTarget.dataset.fallbackApplied = '1'
                  e.currentTarget.src = fallbackAvatar
                }}
                className="h-20 w-20 shrink-0 rounded-full border border-black/10 bg-white object-cover object-top dark:border-white/15"
              />
              <div className="min-w-0">
                <h3 className="font-display text-lg font-semibold">Personal Data</h3>
                <p className="truncate text-sm text-[rgb(var(--text-muted))]">{admin?.name || '-'}</p>
                <p className="truncate text-xs text-[rgb(var(--text-muted))]">{admin?.email || '-'}</p>
              </div>
            </div>
            {!editingProfile ? (
              <Button variant="ghost" onClick={() => setEditingProfile(true)}>
                <MaterialIcon name="edit" />
                Edit Personal Data
              </Button>
            ) : null}
          </div>

          {editingProfile ? (
            <form className="mt-5 space-y-4" onSubmit={onSubmitProfile}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Name"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                />
                <Input
                  label="Email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Profile Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)}
                  className="h-11 w-full rounded-2xl border border-black/10 bg-[rgb(var(--panel))]/95 px-3 py-2 text-sm text-[rgb(var(--text))] outline-none transition-all duration-200 focus:border-secondary/60 focus:ring-4 focus:ring-secondary/15 dark:border-white/15 dark:bg-[rgb(var(--panel))]/90"
                />
                <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">
                  PNG/JPG image up to 5MB.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={profileAvatar}
                    alt="Profile preview"
                    onError={(e) => {
                      if (e.currentTarget.dataset.fallbackApplied === '1') return
                      e.currentTarget.dataset.fallbackApplied = '1'
                      e.currentTarget.src = fallbackAvatar
                    }}
                    className="h-16 w-16 rounded-full border border-black/10 bg-white object-cover object-top dark:border-white/15"
                  />
                  <p className="text-xs text-[rgb(var(--text-muted))]">
                    Preview. Make sure the face is centered before saving.
                  </p>
                </div>
              </label>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" onClick={resetProfileEditor}>
                  Cancel
                </Button>
                <Button type="submit" disabled={profileMut.isPending}>
                  <MaterialIcon name={profileMut.isPending ? 'sync' : 'save'} className={profileMut.isPending ? 'animate-spin' : undefined} />
                  {profileMut.isPending ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          ) : null}
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold">Password & Security</h3>
              <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                Protect your account with a strong password.
              </p>
            </div>
            {!editingPassword ? (
              <Button variant="ghost" onClick={() => setEditingPassword(true)}>
                <MaterialIcon name="lock_reset" />
                Edit Password
              </Button>
            ) : null}
          </div>

          {editingPassword ? (
            <form className="mt-5 space-y-4" onSubmit={onChangePassword}>
              <Input
                label="Current Password"
                type="password"
                value={password.currentPassword}
                onChange={(e) => setPassword((p) => ({ ...p, currentPassword: e.target.value }))}
              />
              <Input
                label="New Password"
                type="password"
                value={password.newPassword}
                onChange={(e) => setPassword((p) => ({ ...p, newPassword: e.target.value }))}
              />
              <Input
                label="Confirm Password"
                type="password"
                value={password.confirmPassword}
                onChange={(e) => setPassword((p) => ({ ...p, confirmPassword: e.target.value }))}
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setEditingPassword(false)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={passwordMut.isPending}>
                  <MaterialIcon name={passwordMut.isPending ? 'sync' : 'lock'} className={passwordMut.isPending ? 'animate-spin' : undefined} />
                  {passwordMut.isPending ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          ) : null}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-display text-lg font-semibold">System Preferences</h3>
          <div className="mt-4 space-y-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={prefs.compactTables}
                onChange={(e) => setPrefs((p) => ({ ...p, compactTables: e.target.checked }))}
              />
              Compact table rows
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold">Default student page size</span>
              <select
                value={prefs.defaultStudentPageSize}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, defaultStudentPageSize: Number(e.target.value) }))
                }
                className="h-11 w-full rounded-2xl border border-black/10 bg-[rgb(var(--panel))]/95 px-3 py-2 text-sm text-[rgb(var(--text))] outline-none transition-all duration-200 focus:border-secondary/60 focus:ring-4 focus:ring-secondary/15 dark:border-white/15 dark:bg-[rgb(var(--panel))]/90"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="secondary" onClick={savePreferences}>
              <MaterialIcon name="save" />
              Save Preferences
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-lg font-semibold">Backup Data</h3>
          <p className="mt-3 text-sm text-[rgb(var(--text-muted))]">
            Download a complete JSON backup of admins, faculties, departments, classes, batches,
            jobs, and active students.
          </p>
          <div className="mt-5">
            <Button variant="secondary" onClick={downloadBackup}>
              <MaterialIcon name="download" />
              Download Backup
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
