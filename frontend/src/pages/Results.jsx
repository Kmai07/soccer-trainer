import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { submissionsAPI } from '../api'
import Navbar from '../components/Navbar'
import ScoreGauge from '../components/ScoreGauge'
import './Results.css'

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [polling, setPolling] = useState(true)

  useEffect(() => {
    if (!id) return
    const interval = setInterval(async () => {
      try {
        const res = await submissionsAPI.getAnalysis(id)
        if (res.data.status === 'completed') {
          setAnalysis(res.data)
          setPolling(false)
          clearInterval(interval)
        } else if (res.data.status === 'failed') {
          setError('Analysis failed. Please try uploading again.')
          setPolling(false)
          clearInterval(interval)
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          setError('Failed to fetch analysis')
          setPolling(false)
          clearInterval(interval)
        }
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [id])

  return (
    <div className="page">
      <Navbar />
      <main className="page__content">
        <button
          type="button"
          className="results__back btn btn--outline"
          onClick={() => navigate('/history')}
        >
          ← Back to History
        </button>

        {polling && (
          <div className="results__polling card">
            <span className="spinner" />
            <h2 className="results__polling-title">Analyzing your video…</h2>
            <p className="results__polling-text">This takes 10–30 seconds. Hang tight.</p>
          </div>
        )}

        {error && !polling && (
          <p className="alert-error" role="alert">{error}</p>
        )}

        {analysis && !polling && (
          <div className="results">
            <header className="results__header">
              <h1 className="results__title">Your Analysis</h1>
              <p className="results__subtitle">Biomechanics breakdown for your kick</p>
            </header>

            <div className="results__score-card card">
              <ScoreGauge score={analysis.overall_score} />
              <p className="results__score-label">Overall Score</p>
            </div>

            <section className="results__section card">
              <h2 className="results__section-title">Strengths</h2>
              <ul className="results__list">
                {analysis.feedback.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>

            <section className="results__section card">
              <h2 className="results__section-title">Areas to Improve</h2>
              <ul className="results__list">
                {analysis.feedback.weaknesses.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </section>

            <section className="results__section card">
              <h2 className="results__section-title">Training Plan</h2>
              <ul className="results__list">
                {analysis.feedback.drill_plan.flat().map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </section>

            <section className="results__section card">
              <h2 className="results__section-title">Pose Metrics</h2>
              <div className="results__metrics">
                <div className="results__metric">
                  <span className="results__metric-label">Avg knee angle</span>
                  <span className="results__metric-value">
                    {analysis.metrics.avg_knee_angle.toFixed(1)}°
                  </span>
                </div>
                <div className="results__metric">
                  <span className="results__metric-label">Min knee angle</span>
                  <span className="results__metric-value">
                    {analysis.metrics.min_knee_angle.toFixed(1)}°
                  </span>
                </div>
              </div>
            </section>

            <button
              type="button"
              className="btn btn--full"
              onClick={() => navigate('/upload')}
            >
              Upload Another Video
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
