// src/contexts/AppContext.jsx
import React, { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [activeCompany, setActiveCompany] = useState(null)
  const [activeScenario, setActiveScenario] = useState(null)

  return (
    <AppContext.Provider value={{ activeCompany, setActiveCompany, activeScenario, setActiveScenario }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
