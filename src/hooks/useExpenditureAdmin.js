import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

/**
 * Admin controls on Expenditure / Disbursement when the signed-in user's email is listed in
 * VITE_EXPENDITURE_ADMIN_EMAILS (comma-separated). If the env var is empty, any logged-in user
 * may use overrides (restrict via env in production).
 */
export function useExpenditureAdmin() {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (!auth) {
      setAllowed(false)
      return undefined
    }
    return onAuthStateChanged(auth, (u) => {
      if (!u?.email) {
        setAllowed(false)
        return
      }
      const raw = import.meta.env.VITE_EXPENDITURE_ADMIN_EMAILS || ''
      const list = raw
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
      setAllowed(list.length === 0 || list.includes(u.email.toLowerCase()))
    })
  }, [])

  return allowed
}
