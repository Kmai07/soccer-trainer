import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../api'
import './Login.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const validate = () => {
    const errors = {}

    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Enter a valid email address'
    }

    if (isRegister && !username.trim()) {
      errors.username = 'Username is required'
    }

    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validate()) return

    setSubmitting(true)
    try {
      if (isRegister) {
        await authAPI.register({ email, username, password })
      }
      const res = await authAPI.login({ email, password })
      localStorage.setItem('token', res.data.access_token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleMode = () => {
    setIsRegister(!isRegister)
    setError('')
    setFieldErrors({})
  }

  return (
    <div className="login-page">
      <div className="login-page__card card">
        <header className="login-page__header">
          <h1 className="login-page__title">Soccer Trainer</h1>
          <p className="login-page__subtitle">
            {isRegister ? 'Create your account' : 'Sign in to your account'}
          </p>
        </header>

        {error && <p className="alert-error" role="alert">{error}</p>}

        <form onSubmit={handleSubmit} className="login-page__form" noValidate>
          <div className="login-page__field">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`form-input${fieldErrors.email ? ' form-input--error' : ''}`}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p className="form-error" role="alert">{fieldErrors.email}</p>
            )}
          </div>

          {isRegister && (
            <div className="login-page__field">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                id="username"
                type="text"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`form-input${fieldErrors.username ? ' form-input--error' : ''}`}
                autoComplete="username"
              />
              {fieldErrors.username && (
                <p className="form-error" role="alert">{fieldErrors.username}</p>
              )}
            </div>
          )}

          <div className="login-page__field">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`form-input${fieldErrors.password ? ' form-input--error' : ''}`}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
            {fieldErrors.password && (
              <p className="form-error" role="alert">{fieldErrors.password}</p>
            )}
          </div>

          <button type="submit" className="btn btn--full" disabled={submitting}>
            {submitting ? 'Please wait…' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <button type="button" className="login-page__toggle" onClick={toggleMode}>
          {isRegister ? 'Already have an account? Login' : 'No account? Register'}
        </button>
      </div>
    </div>
  )
}
