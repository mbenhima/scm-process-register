// src/licensing/LicenceProvider.js
// The D30 LicenceProvider abstraction: a single interface, multiple implementations,
// selected once at boot by VITE_DEPLOYMENT_MODE. This SaaS build implements the SaaS
// path in full (Firestore-backed, per D30 Section 4); OnPremLicenceProvider is included
// only as a documented stub, since a signed-.lic-file flow is out of scope for a hosted
// SaaS deployment (see the Installation Guide's "Deployment Modes" appendix).
//
// interface LicenceProvider {
//   check(): { status: 'active'|'expired'|'warning'|'inactive', daysLeft: number, licence: object }
//   canCreateUser(currentUserCount: number): boolean
//   getMode(): 'saas' | 'onprem'
//   getMaxUsers(): number
//   getExpiryDate(): Date | null
//   getPlan(): string | null
//   getFeatureFlags(): string[]
// }

import { PLAN_MODULES } from '../lib/catalogue'

export class SaasLicenceProvider {
  constructor(licenceDoc) {
    // licenceDoc mirrors D30 Section 7's license file fields, stored instead at
    // Firestore licences/{organizationId} (D30 Section 4: "licences/{companyId}").
    this.licence = licenceDoc || null
  }

  getMode() {
    return 'saas'
  }

  getPlan() {
    return this.licence?.plan || null
  }

  getMaxUsers() {
    return this.licence?.maxUsers ?? 0
  }

  getExpiryDate() {
    return this.licence?.expiryDate ? new Date(this.licence.expiryDate) : null
  }

  getFeatureFlags() {
    if (this.licence?.features?.length) return this.licence.features
    return PLAN_MODULES[this.getPlan()] || []
  }

  hasModule(moduleId) {
    return this.getFeatureFlags().includes(moduleId)
  }

  check() {
    if (!this.licence) return { status: 'inactive', daysLeft: 0, licence: null }
    const expiry = this.getExpiryDate()
    const now = new Date()
    if (!expiry) return { status: 'active', daysLeft: Infinity, licence: this.licence }
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
    if (daysLeft < 0) return { status: 'expired', daysLeft, licence: this.licence }
    if (daysLeft <= 14) return { status: 'warning', daysLeft, licence: this.licence }
    return { status: 'active', daysLeft, licence: this.licence }
  }

  canCreateUser(currentUserCount) {
    const max = this.getMaxUsers()
    if (!max) return false
    return currentUserCount < max
  }
}

// OnPrem is documented in D30 but intentionally not implemented in this SaaS build.
export class OnPremLicenceProvider {
  constructor() {
    throw new Error('OnPrem licensing mode is documented in D30 but not implemented in this SaaS-only build. Set VITE_DEPLOYMENT_MODE=saas.')
  }
}

export function getLicenceProviderClass() {
  const mode = import.meta.env.VITE_DEPLOYMENT_MODE || 'saas'
  if (mode === 'onprem') return OnPremLicenceProvider
  return SaasLicenceProvider
}
