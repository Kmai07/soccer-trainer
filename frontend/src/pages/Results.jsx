import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { submissionsAPI } from '../api'

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
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          setError('Failed to fetch analysis')
          clearInterval(interval)
        }
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [id])

  if (polling) return (
    <div style={{ maxWidth: 600, margin: '60px auto', padding: 24, textAlign: 'center' }}>
      <h2>Analyzing your video...</h2>
      <p>This takes 10-30 seconds. Hang tight.</p>
    </div>
  )

  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div style={{ maxWidth: 600, margin: '60px auto', padding: 24 }}>
      <h1>Your Analysis</h1>
      <div style={{ fontSize: 48, textAlign: 'center', margin: '16px 0' }}>
        {analysis.overall_score}/100
      </div>
      <h2>Strengths</h2>
      <ul>
        {analysis.feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
      <h2>Areas to Improve</h2>
      <ul>
        {analysis.feedback.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
      </ul>
      <h2>Training Plan</h2>
      <ul>
        {analysis.feedback.drill_plan.flat().map((d, i) => <li key={i}>{d}</li>)}
      </ul>
      <h2>Pose Metrics</h2>
      <p>Avg knee angle: {analysis.metrics.avg_knee_angle.toFixed(1)}°</p>
      <p>Min knee angle: {analysis.metrics.min_knee_angle.toFixed(1)}°</p>
      <button onClick={() => navigate('/upload')} style={{ marginTop: 24, padding: 10 }}>
        Upload another video
      </button>
    </div>
  )
}