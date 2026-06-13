import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { submissionsAPI } from '../api'
import Navbar from '../components/Navbar'
import './History.css'

const STATUS_STYLES = {
  completed: 'history-card__status--completed',
  processing: 'history-card__status--processing',
  failed: 'history-card__status--failed',
  pending: 'history-card__status--pending',
}

function formatDrillType(type) {
  if (!type) return 'Unknown'
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusClass(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.pending
}

export default function History() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await submissionsAPI.list()
        setSubmissions(res.data)
      } catch {
        setError('Failed to load submission history')
      } finally {
        setLoading(false)
      }
    }
    fetchSubmissions()
  }, [])

  const handleCardClick = (submission) => {
    if (submission.status === 'completed') {
      navigate(`/results/${submission.id}`)
    }
  }

  return (
    <div className="page">
      <Navbar />
      <main className="page__content page__content--wide">
        <header className="history__header">
          <h1 className="history__title">Submission History</h1>
          <p className="history__subtitle">Review your past drill analyses</p>
        </header>

        {error && <p className="alert-error" role="alert">{error}</p>}

        {loading && (
          <div className="history__loading">
            <span className="spinner" />
            <span>Loading submissions…</span>
          </div>
        )}

        {!loading && !error && submissions.length === 0 && (
          <div className="history__empty card">
            <p className="history__empty-title">No submissions yet</p>
            <p className="history__empty-text">
              Upload your first kick video to start tracking your biomechanics analysis.
            </p>
            <button type="button" className="btn" onClick={() => navigate('/upload')}>
              Upload a Video
            </button>
          </div>
        )}

        {!loading && submissions.length > 0 && (
          <div className="history__grid">
            {submissions.map((submission) => (
              <article
                key={submission.id}
                className={`history-card card${submission.status === 'completed' ? ' history-card--clickable' : ''}`}
                onClick={() => handleCardClick(submission)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleCardClick(submission)
                  }
                }}
                role={submission.status === 'completed' ? 'button' : undefined}
                tabIndex={submission.status === 'completed' ? 0 : undefined}
              >
                <div className="history-card__top">
                  <h2 className="history-card__drill">
                    {formatDrillType(submission.drill_type)}
                  </h2>
                  <span className={`history-card__status ${getStatusClass(submission.status)}`}>
                    {submission.status}
                  </span>
                </div>
                <p className="history-card__date">
                  {formatDate(submission.created_at)}
                </p>
                {submission.status === 'completed' && (
                  <p className="history-card__hint">Click to view results</p>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
