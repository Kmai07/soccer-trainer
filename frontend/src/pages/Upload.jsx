import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submissionsAPI } from '../api'

const DRILL_TYPES = ['free_kick', 'passing', 'dribbling', 'shooting']

export default function Upload() {
  const [file, setFile] = useState(null)
  const [drillType, setDrillType] = useState('free_kick')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const res = await submissionsAPI.create(file, drillType)
      navigate(`/results/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: '60px auto', padding: 24 }}>
      <h1>Upload Your Drill</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Drill type</label>
          <select
            value={drillType}
            onChange={(e) => setDrillType(e.target.value)}
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
          >
            {DRILL_TYPES.map(d => (
              <option key={d} value={d}>{d.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Video file</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ display: 'block', marginTop: 4 }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !file}
          style={{ width: '100%', padding: 10 }}
        >
          {loading ? 'Uploading...' : 'Upload and Analyze'}
        </button>
      </form>
      <button onClick={() => navigate('/results')} style={{ marginTop: 16 }}>
        View past submissions
      </button>
    </div>
  )
}