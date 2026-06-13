import './FilePreview.css'

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FilePreview({ file }) {
  if (!file) return null

  return (
    <div className="file-preview">
      <div className="file-preview__icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      </div>
      <div className="file-preview__info">
        <p className="file-preview__name">{file.name}</p>
        <p className="file-preview__meta">{formatSize(file.size)} · MP4/MOV</p>
      </div>
    </div>
  )
}
