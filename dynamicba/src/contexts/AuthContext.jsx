import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp, increment, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { DEFAULT_PERMISSION_MATRIX } from '../lib/roles'
import { AI_USE_CASES, PLAN_MODULES } from '../lib/catalogue'

const AuthContext = createContext(null)

const STARTER_MAX_USERS = 5
const PLAN_DEFAULT_MAX_USERS = { starter: 5, professional: 15, enterprise: 100, pay_per_project: 3 }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // Firebase auth user
  const [profile, setProfile] = useState(null) // users/{uid} Firestore doc
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u)
      if (!u) {
        setProfile(null)
        setLoading(false)
      }
    })
    return unsubAuth
  }, [])

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setProfile(snap.exists() ? snap.data() : null)
      setLoading(false)
    })
    return unsub
  }, [user])

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    await signOut(auth)
  }

  // Founds a brand-new Organization (tenant) and becomes its first org_admin.
  async function registerAndCreateOrganization({ email, password, name, orgName, sector, country, plan }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const uid = cred.user.uid
    const orgId = `org_${uid.slice(0, 12)}`
    const chosenPlan = plan || 'starter'

    await setDoc(doc(db, 'users', uid), {
      uid, email, name, orgId, roles: ['org_admin'], language: 'en', createdAt: serverTimestamp(),
    })
    await setDoc(doc(db, 'organizations', orgId), {
      name: orgName, sector: sector || '', country: country || '', defaultLanguage: 'en',
      memberCount: 1, createdBy: uid, createdAt: serverTimestamp(),
    })
    await setDoc(doc(db, 'licences', orgId), {
      plan: chosenPlan,
      maxUsers: PLAN_DEFAULT_MAX_USERS[chosenPlan] || STARTER_MAX_USERS,
      features: PLAN_MODULES[chosenPlan] || PLAN_MODULES.starter,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      issueDate: new Date().toISOString(),
      companyName: orgName,
      version: 1,
    })
    await setDoc(doc(db, 'organizations', orgId, 'config', 'permissionMatrix'), DEFAULT_PERMISSION_MATRIX)
    await setDoc(doc(db, 'organizations', orgId, 'config', 'complianceStandards'), { GDPR: false, ISO27001: false, SOC2: false })
    for (const uc of AI_USE_CASES) {
      await setDoc(doc(db, 'organizations', orgId, 'aiUseCaseActivation', uc.id), { active: true })
    }
    return { uid, orgId }
  }

  // Joins an existing Organization by its Organization ID (shared by its admin), subject
  // to that Organization's licence seat count (NFR-DA-SEC-08).
  async function registerAndJoinOrganization({ email, password, name, orgId, role }) {
    const orgSnap = await getDoc(doc(db, 'organizations', orgId))
    if (!orgSnap.exists()) throw new Error('No Organization found with that ID. Ask your admin for the exact Organization ID.')
    const licSnap = await getDoc(doc(db, 'licences', orgId))
    const maxUsers = licSnap.exists() ? licSnap.data().maxUsers : 0
    if (orgSnap.data().memberCount >= maxUsers) {
      throw new Error(`This Organization has reached its licence limit (${orgSnap.data().memberCount} of ${maxUsers} seats used). Ask an admin to upgrade the plan.`)
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const uid = cred.user.uid
    await setDoc(doc(db, 'users', uid), {
      uid, email, name, orgId, roles: [role || 'business_analyst'], language: 'en', createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'organizations', orgId), { memberCount: increment(1) })
    return { uid, orgId }
  }

  const value = { user, profile, loading, login, logout, registerAndCreateOrganization, registerAndJoinOrganization }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
