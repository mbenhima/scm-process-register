import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      if (!api.getToken()) { setLoading(false); return }
      try {
        const { user } = await api.get('/auth/me')
        setProfile(user)
      } catch {
        api.setToken(null)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  async function login(email, password) {
    const { token, user } = await api.post('/auth/login', { email, password })
    api.setToken(token)
    setProfile(user)
  }

  function logout() {
    api.setToken(null)
    setProfile(null)
  }

  async function registerAndCreateOrganization(form) {
    const { token, user } = await api.post('/auth/register/create-organization', form)
    api.setToken(token)
    setProfile(user)
  }

  async function registerAndJoinOrganization(form) {
    const { token, user } = await api.post('/auth/register/join-organization', form)
    api.setToken(token)
    setProfile(user)
  }

  // `user` is kept as an alias of `profile` for compatibility with the route guards.
  const value = { user: profile, profile, loading, login, logout, registerAndCreateOrganization, registerAndJoinOrganization }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
