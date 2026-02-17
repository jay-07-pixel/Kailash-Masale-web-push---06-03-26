import React, { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import './LoginModal.css'

export function isAuthenticated() {
  return !!auth.currentUser
}

function LoginModal({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedEmail) {
      setError('Please enter your email address.')
      return
    }
    if (!trimmedPassword) {
      setError('Please enter your password.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword)
      onSuccess?.()
    } catch (err) {
      const code = err.code || ''
      let msg
      if (code === 'auth/operation-not-allowed') {
        msg = 'Email/Password sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.'
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        msg = 'Invalid email or password.'
      } else if (code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.'
      } else if (code === 'auth/user-disabled') {
        msg = 'This account has been disabled.'
      } else if (code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please try again later.'
      } else {
        msg = err.message || 'Sign in failed. Please try again.'
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-overlay" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className="login-backdrop" />
      <div className="login-container">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-logo">KM</div>
            <h1 id="login-title" className="login-title">Kailash Masale</h1>
            <p className="login-subtitle">Sign in to continue</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <div className="login-field">
              <label htmlFor="login-email" className="login-label">Email</label>
              <input
                id="login-email"
                type="email"
                className="login-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-password" className="login-label">Password</label>
              <input
                id="login-password"
                type="password"
                className="login-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="login-spinner" aria-hidden />
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginModal
