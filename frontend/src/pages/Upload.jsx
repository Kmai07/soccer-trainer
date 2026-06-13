import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submissionsAPI } from '../api'
import Navbar from '../components/Navbar'
import VideoDropzone from '../components/VideoDropzone'
import UploadProgress from '../components/UploadProgress'
import FilePreview from '../components/FilePreview'
import './Upload.css'

const DRILL_TYPES = ['free_kick', 'passing', 'dribbling', 'shooting']

function waitForAnalysis(submissionId) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const maxAttempts = 40

    const interval = setInterval(async () => {
      attempts += 1
      try {
        const res = await submissionsAPI.getAnalysis(submissionId)
        if (res.data.status === 'completed') {
          clearInterval(interval)
          resolve(res.data)
        } else if (res.data.status === 'failed') {
          clearInterval(interval)
          reject(new Error('Analysis failed'))
        } else if (attempts >= maxAttempts) {
          clearInterval(interval)
          reject(new Error('Analysis timed out'))
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          clearInterval(interval)
          reject(err)
        } else if (attempts >= maxAttempts) {
          clearInterval(interval)
          reject(new Error('Analysis timed out'))
        }
      }
    }, 3000)
  })
}

export default function Upload() {
  const [file, setFile] = useState(null)
  const [drillType, setDrillType] = useState('free_kick')
  const [phase, setPhase] = useState('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const isBusy = phase === 'uploading' || phase === 'analyzing'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file || isBusy) return

    setPhase('uploading')
    setUploadProgress(0)
    setError('')

    try {
      const res = await submissionsAPI.create(file, drillType, {
        onUploadProgress: (event) => {
          if (event.total) {
            setUploadProgress(Math.round((event.loaded * 100) / event.total))
          }
        },
      })

      setUploadProgress(100)
      setPhase('analyzing')

      await waitForAnalysis(res.data.id)
      navigate(`/results/${res.data.id}`)
    } catch (err) {
      setError(
        err.message === 'Analysis failed'
          ? 'Analysis failed. Please try again.'
          : err.message === 'Analysis timed out'
            ? 'Analysis is taking longer than expected. Check History shortly.'
            : err.response?.data?.detail || 'Upload failed'
      )
    } finally {
      setPhase('idle')
      setUploadProgress(0)
    }
  }

  return (
    <div className="page">
      <Navbar />
      <main className="page__content">
        <div className="upload-page__card card">
          <header className="upload-page__header">
            <h1 className="upload-page__title">Kick Biomechanics Analyzer</h1>
            <p className="upload-page__subtitle">
              Upload a video of your kick for biomechanical analysis
            </p>
          </header>

          {error && <p className="alert-error" role="alert">{error}</p>}

          <form onSubmit={handleSubmit} className="upload-page__form">
            <div className="upload-page__field">
              <label htmlFor="drill-type" className="form-label">
                Drill type
              </label>
              <select
                id="drill-type"
                value={drillType}
                onChange={(e) => setDrillType(e.target.value)}
                className="upload-page__select"
                disabled={isBusy}
              >
                {DRILL_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {d.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="upload-page__field">
              <label className="form-label">Video file</label>
              <VideoDropzone
                file={file}
                onFileSelect={setFile}
                disabled={isBusy}
              />
              <FilePreview file={file} />
              <UploadProgress progress={uploadProgress} visible={phase === 'uploading'} />
            </div>

            <button
              type="submit"
              className="btn btn--full upload-page__submit"
              disabled={isBusy || !file}
            >
              {phase === 'analyzing' && <span className="spinner" />}
              {phase === 'uploading'
                ? 'Uploading…'
                : phase === 'analyzing'
                  ? 'Analyzing…'
                  : 'Upload and Analyze'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
