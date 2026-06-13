import './UploadProgress.css'

export default function UploadProgress({ progress, visible }) {
  if (!visible) return null

  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className="upload-progress" role="progressbar" aria-valuenow={clampedProgress} aria-valuemin={0} aria-valuemax={100}>
      <div className="upload-progress__header">
        <span className="upload-progress__label">Uploading video…</span>
        <span className="upload-progress__percent">{Math.round(clampedProgress)}%</span>
      </div>
      <div className="upload-progress__track">
        <div
          className="upload-progress__bar"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}
