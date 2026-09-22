import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { PLAN_LABELS } from '../lib/catalogue'
import { ROLES } from '../lib/roles'

export default function RegisterPage() {
  const { registerAndCreateOrganization, registerAndJoinOrganization } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('create') // 'create' | 'join'
  const [form, setForm] = useState({
    name: '', email: '', password: '', orgName: '', sector: '', country: '', plan: 'starter', orgId: '', role: 'business_analyst',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'create') {
        await registerAndCreateOrganization(form)
      } else {
        await registerAndJoinOrganization(form)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg py-10">
      <div className="card p-8 w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="font-serif font-bold text-2xl text-grey-dark">Create your DynamicBA account</div>
        </div>
        <div className="flex gap-2 mb-6">
          <button className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mode === 'create' ? 'bg-orange text-white' : 'bg-grey-light text-grey-ink'}`} onClick={() => setMode('create')} type="button">
            Found a new Organization
          </button>
          <button className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mode === 'join' ? 'bg-orange text-white' : 'bg-grey-light text-grey-ink'}`} onClick={() => setMode('join')} type="button">
            Join an existing Organization
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="label">Password (min. 6 characters)</label>
            <input className="input" type="password" minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} required />
          </div>

          {mode === 'create' ? (
            <>
              <div>
                <label className="label">Organization (Consulting Firm) Name</label>
                <input className="input" value={form.orgName} onChange={(e) => set('orgName', e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Sector</label>
                  <input className="input" value={form.sector} onChange={(e) => set('sector', e.target.value)} placeholder="Management Consulting" />
                </div>
                <div>
                  <label className="label">Country</label>
                  <input className="input" value={form.country} onChange={(e) => set('country', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Starting Plan</label>
                <select className="input" value={form.plan} onChange={(e) => set('plan', e.target.value)}>
                  {Object.entries(PLAN_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
                <p className="text-xs text-grey-medium mt-1">You can change this later in Admin → Licensing.</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">Organization ID</label>
                <input className="input" value={form.orgId} onChange={(e) => set('orgId', e.target.value)} placeholder="org_xxxxxxxxxxxx" required />
                <p className="text-xs text-grey-medium mt-1">Ask your Organization Admin for this (Admin → Organization Settings).</p>
              </div>
              <div>
                <label className="label">Your Role</label>
                <select className="input" value={form.role} onChange={(e) => set('role', e.target.value)}>
                  {ROLES.filter((r) => r.id !== 'org_admin').map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            </>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create Account'}</button>
        </form>
        <div className="text-center mt-4 text-sm text-grey-ink">
          Already have an account? <Link to="/login" className="text-orange-deep font-semibold">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
