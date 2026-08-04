import React from 'react'
import { Navigate } from 'react-router-dom'
import { useI18n, LANGUAGES } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { roleLabelKey } from '../utils/rbac.js'

export default function LoginPage() {
  const { t, lang, setLang } = useI18n()
  const { data, currentUser, signIn } = useAppState()

  if (currentUser) return <Navigate to="/app/dashboard" replace />

  const orderedRoles = [
    'super_admin',
    'group_admin',
    'org_admin',
    'sponsor',
    'change_manager',
    'people_manager',
    'employee',
    'executive',
  ]
  const sortedUsers = [...data.users].sort((a, b) => orderedRoles.indexOf(a.role) - orderedRoles.indexOf(b.role))

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 p-4">
      <div className="absolute top-4 end-4">
        <select className="input bg-white/10 text-white border-white/30" value={lang} onChange={(e) => setLang(e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} className="text-ink">
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
            j
          </div>
          <h1 className="text-3xl font-bold text-white">{t('loginTitle')}</h1>
          <p className="text-brand-100 mt-2 italic">{t('appTagline')}</p>
          <p className="text-brand-200/80 text-sm mt-3 max-w-md mx-auto">{t('loginSubtitle')}</p>
        </div>

        <div className="card p-5">
          <p className="label mb-3">{t('chooseDemoUser')}</p>
          <div className="grid sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pe-1">
            {sortedUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => signIn(u.id)}
                className="text-start rounded-lg border border-brand-100 hover:border-brand-400 hover:bg-brand-50 transition-colors px-3 py-2"
              >
                <div className="font-semibold text-sm text-brand-950">{u.name}</div>
                <div className="text-xs text-ink/50">{t(roleLabelKey(u.role))}</div>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-ink/40 mt-4 text-center">{t('demoNotice')}</p>
        </div>
      </div>
    </div>
  )
}
